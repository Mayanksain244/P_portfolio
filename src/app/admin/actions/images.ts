"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import {
  addImageSchema,
  idSchema,
  imageUpdateSchema,
  UPLOAD_EXTS,
} from "@/lib/admin/schemas";
import { dbFail, fail, zodFieldErrors, type ActionResult } from "@/lib/admin/result";
import {
  adminDb,
  BUCKET,
  ensureCover,
  removeStorage,
  revalidateGallery,
} from "@/lib/admin/server";

const NO_DB = "The database is not configured.";

async function albumSlug(db: NonNullable<ReturnType<typeof adminDb>>, albumId: string) {
  const { data } = await db.from("albums").select("slug").eq("id", albumId).maybeSingle();
  return (data?.slug as string | undefined) ?? null;
}

async function nextSortOrder(db: NonNullable<ReturnType<typeof adminDb>>, albumId: string) {
  const { data } = await db
    .from("images")
    .select("sort_order")
    .eq("album_id", albumId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data?.sort_order as number | null) ?? -1) + 1;
}

/** Step 1 of an upload: returns a one-time signed URL so the browser uploads straight to Storage. */
export async function createUploadUrl(
  albumId: unknown,
  ext: unknown,
): Promise<ActionResult<{ path: string; token: string; signedUrl: string }>> {
  await requireAdmin();
  const a = idSchema.safeParse(albumId);
  const e = z.enum(UPLOAD_EXTS).safeParse(ext);
  if (!a.success || !e.success) return fail("Invalid upload request.");
  const db = adminDb();
  if (!db) return fail(NO_DB);
  if (!(await albumSlug(db, a.data))) return fail("Album not found.");

  const path = `albums/${a.data}/${randomUUID()}.${e.data}`;
  const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return dbFail("createUploadUrl", error, "Could not start the upload.");
  return { ok: true, path, token: data.token, signedUrl: data.signedUrl };
}

/** Step 3 of an upload: records the uploaded file as an image row (and makes it the cover if none). */
export async function addImage(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = addImageSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid image data.");
  const { albumId, path, width, height, blur } = parsed.data;
  if (!path.startsWith(`albums/${albumId}/`)) return fail("Invalid image path.");
  const db = adminDb();
  if (!db) return fail(NO_DB);
  const slug = await albumSlug(db, albumId);
  if (!slug) return fail("Album not found.");

  const sort_order = await nextSortOrder(db, albumId);
  const { data, error } = await db
    .from("images")
    .insert({
      album_id: albumId,
      storage_path: path,
      width,
      height,
      blur_data_url: blur ?? null,
      sort_order,
    })
    .select("id")
    .single();
  if (error) return dbFail("addImage", error, "Could not save the photo.");
  await ensureCover(db, albumId);
  revalidateGallery([slug]);
  return { ok: true, id: data.id as string };
}

/** Removes an uploaded file whose row was never saved (best effort cleanup after a failed upload). */
export async function discardUpload(albumId: unknown, path: unknown): Promise<ActionResult> {
  await requireAdmin();
  const a = idSchema.safeParse(albumId);
  if (!a.success || typeof path !== "string" || !path.startsWith(`albums/${a.data}/`)) {
    return fail("Invalid request.");
  }
  const db = adminDb();
  if (!db) return fail(NO_DB);
  const { data } = await db.from("images").select("id").eq("storage_path", path).maybeSingle();
  if (data) return { ok: true }; // referenced; leave it
  await removeStorage(db, [path]);
  return { ok: true };
}

export async function updateImage(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = imageUpdateSchema.safeParse(input);
  if (!parsed.success) return fail("Please check the values.", zodFieldErrors(parsed.error));
  const { id, ...patch } = parsed.data;
  const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
  if (!Object.keys(clean).length) return { ok: true };
  const db = adminDb();
  if (!db) return fail(NO_DB);
  const { data, error } = await db
    .from("images")
    .update(clean)
    .eq("id", id)
    .select("album_id")
    .maybeSingle();
  if (error) return dbFail("updateImage", error, "Could not save the change.");
  if (!data) return fail("Photo not found.");
  revalidateGallery([await albumSlug(db, data.album_id as string)]);
  return { ok: true };
}

export async function setCover(albumId: unknown, imageId: unknown): Promise<ActionResult> {
  await requireAdmin();
  const a = idSchema.safeParse(albumId);
  const i = idSchema.safeParse(imageId);
  if (!a.success || !i.success) return fail("Invalid request.");
  const db = adminDb();
  if (!db) return fail(NO_DB);
  const { data: img } = await db
    .from("images")
    .select("id")
    .eq("id", i.data)
    .eq("album_id", a.data)
    .maybeSingle();
  if (!img) return fail("Photo not found in this album.");
  const { error } = await db.from("albums").update({ cover_image_id: i.data }).eq("id", a.data);
  if (error) return dbFail("setCover", error);
  revalidateGallery([await albumSlug(db, a.data)]);
  return { ok: true };
}

/** Saves a new order for all photos of an album. */
export async function reorderImages(albumId: unknown, orderedIds: unknown): Promise<ActionResult> {
  await requireAdmin();
  const a = idSchema.safeParse(albumId);
  const ids = z.array(idSchema).max(1000).safeParse(orderedIds);
  if (!a.success || !ids.success) return fail("Invalid request.");
  const db = adminDb();
  if (!db) return fail(NO_DB);
  const { data: existing, error } = await db.from("images").select("id").eq("album_id", a.data);
  if (error) return dbFail("reorderImages list", error);
  const valid = new Set((existing ?? []).map((r) => r.id as string));
  const order = ids.data.filter((id) => valid.has(id));
  const results = await Promise.all(
    order.map((id, i) => db.from("images").update({ sort_order: i }).eq("id", id)),
  );
  const bad = results.find((r) => r.error);
  if (bad?.error) return dbFail("reorderImages", bad.error);
  revalidateGallery([await albumSlug(db, a.data)]);
  return { ok: true };
}

/** Moves photos (and their files) to another album, appended at the end; fixes covers on both albums. */
export async function moveImages(imageIds: unknown, toAlbumId: unknown): Promise<ActionResult<{ moved: number }>> {
  await requireAdmin();
  const ids = z.array(idSchema).min(1).max(200).safeParse(imageIds);
  const to = idSchema.safeParse(toAlbumId);
  if (!ids.success || !to.success) return fail("Invalid request.");
  const db = adminDb();
  if (!db) return fail(NO_DB);
  const toSlug = await albumSlug(db, to.data);
  if (!toSlug) return fail("Target album not found.");

  const { data: rows, error } = await db
    .from("images")
    .select("id, album_id, storage_path, sort_order, created_at")
    .in("id", ids.data);
  if (error) return dbFail("moveImages list", error);
  const imgs = (rows ?? [])
    .filter((r) => r.album_id !== to.data)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || String(a.created_at).localeCompare(String(b.created_at)));
  if (!imgs.length) return { ok: true, moved: 0 };

  let next = await nextSortOrder(db, to.data);
  const fromAlbums = new Set<string>();
  let moved = 0;
  for (const img of imgs) {
    const oldPath = img.storage_path as string;
    const file = oldPath.split("/").pop()!;
    const newPath = `albums/${to.data}/${file}`;
    const mv = await db.storage.from(BUCKET).move(oldPath, newPath);
    if (mv.error) {
      console.error(`[admin] moveImages storage: ${mv.error.message}`);
      continue;
    }
    const { error: ue } = await db
      .from("images")
      .update({ album_id: to.data, storage_path: newPath, sort_order: next++ })
      .eq("id", img.id);
    if (ue) {
      console.error(`[admin] moveImages row: ${ue.message}`);
      await db.storage.from(BUCKET).move(newPath, oldPath); // roll the file back
      continue;
    }
    // A moved image may have been its old album's cover; ensureCover below repairs that.
    fromAlbums.add(img.album_id as string);
    moved++;
  }

  const slugs: (string | null)[] = [toSlug];
  for (const from of fromAlbums) {
    await ensureCover(db, from);
    slugs.push(await albumSlug(db, from));
  }
  await ensureCover(db, to.data);
  revalidateGallery(slugs);
  if (moved < imgs.length) {
    return fail(`Moved ${moved} of ${imgs.length} photos. Some could not be moved.`);
  }
  return { ok: true, moved };
}

export async function deleteImages(imageIds: unknown): Promise<ActionResult<{ deleted: number }>> {
  await requireAdmin();
  const ids = z.array(idSchema).min(1).max(200).safeParse(imageIds);
  if (!ids.success) return fail("Invalid request.");
  const db = adminDb();
  if (!db) return fail(NO_DB);
  const { data: rows, error } = await db
    .from("images")
    .select("id, album_id, storage_path")
    .in("id", ids.data);
  if (error) return dbFail("deleteImages list", error);
  if (!rows?.length) return { ok: true, deleted: 0 };

  await removeStorage(db, rows.map((r) => r.storage_path as string));
  const { error: de } = await db.from("images").delete().in("id", rows.map((r) => r.id as string));
  if (de) return dbFail("deleteImages", de, "Could not delete the photos.");

  const slugs: (string | null)[] = [];
  for (const albumId of new Set(rows.map((r) => r.album_id as string))) {
    await ensureCover(db, albumId);
    slugs.push(await albumSlug(db, albumId));
  }
  revalidateGallery(slugs);
  return { ok: true, deleted: rows.length };
}
