"use server";

import { requireAdmin } from "@/lib/auth/session";
import { albumSchema, idSchema } from "@/lib/admin/schemas";
import { dbFail, fail, zodFieldErrors, type ActionResult } from "@/lib/admin/result";
import { adminDb, removeStorage, revalidateGallery, BUCKET } from "@/lib/admin/server";

const NO_DB = "The database is not configured.";
const SLUG_TAKEN = "That slug is already used by another album.";

type PgErr = { code?: string; message?: string };

export async function createAlbum(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = albumSchema.safeParse(input);
  if (!parsed.success) return fail("Please fix the highlighted fields.", zodFieldErrors(parsed.error));
  const db = adminDb();
  if (!db) return fail(NO_DB);

  const { data: first } = await db
    .from("albums")
    .select("sort_order")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();
  const sort_order = ((first?.sort_order as number | null) ?? 0) - 1;

  const { data, error } = await db
    .from("albums")
    .insert({ ...parsed.data, sort_order })
    .select("id")
    .single();
  if (error) {
    if ((error as PgErr).code === "23505") return fail(SLUG_TAKEN, { slug: SLUG_TAKEN });
    return dbFail("createAlbum", error, "Could not create the album.");
  }
  revalidateGallery([parsed.data.slug]);
  return { ok: true, id: data.id as string };
}

export async function updateAlbum(id: unknown, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const idOk = idSchema.safeParse(id);
  if (!idOk.success) return fail("Album not found.");
  const parsed = albumSchema.safeParse(input);
  if (!parsed.success) return fail("Please fix the highlighted fields.", zodFieldErrors(parsed.error));
  const db = adminDb();
  if (!db) return fail(NO_DB);

  const { data: old } = await db.from("albums").select("slug").eq("id", idOk.data).maybeSingle();
  if (!old) return fail("Album not found.");

  const { error } = await db.from("albums").update(parsed.data).eq("id", idOk.data);
  if (error) {
    if ((error as PgErr).code === "23505") return fail(SLUG_TAKEN, { slug: SLUG_TAKEN });
    return dbFail("updateAlbum", error, "Could not save the album.");
  }
  revalidateGallery([old.slug as string, parsed.data.slug]);
  return { ok: true };
}

export async function setAlbumPublished(id: unknown, published: unknown): Promise<ActionResult> {
  await requireAdmin();
  const idOk = idSchema.safeParse(id);
  if (!idOk.success || typeof published !== "boolean") return fail("Invalid request.");
  const db = adminDb();
  if (!db) return fail(NO_DB);
  const { data, error } = await db
    .from("albums")
    .update({ published })
    .eq("id", idOk.data)
    .select("slug")
    .maybeSingle();
  if (error) return dbFail("setAlbumPublished", error);
  if (!data) return fail("Album not found.");
  revalidateGallery([data.slug as string]);
  return { ok: true };
}

/** Moves an album one place up/down in the admin ordering (sort_order asc, newest first on ties). */
export async function moveAlbum(id: unknown, direction: unknown): Promise<ActionResult> {
  await requireAdmin();
  const idOk = idSchema.safeParse(id);
  if (!idOk.success || (direction !== "up" && direction !== "down")) return fail("Invalid request.");
  const db = adminDb();
  if (!db) return fail(NO_DB);

  const { data, error } = await db
    .from("albums")
    .select("id, slug, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) return dbFail("moveAlbum list", error);
  const list = data ?? [];
  const from = list.findIndex((a) => a.id === idOk.data);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= list.length) return { ok: true };
  [list[from], list[to]] = [list[to], list[from]];

  const changed = list
    .map((a, i) => ({ a, i }))
    .filter(({ a, i }) => a.sort_order !== i);
  const results = await Promise.all(
    changed.map(({ a, i }) => db.from("albums").update({ sort_order: i }).eq("id", a.id)),
  );
  const bad = results.find((r) => r.error);
  if (bad?.error) return dbFail("moveAlbum update", bad.error);
  revalidateGallery(list.map((a) => a.slug as string));
  return { ok: true };
}

export async function deleteAlbum(id: unknown, confirmSlug: unknown): Promise<ActionResult> {
  await requireAdmin();
  const idOk = idSchema.safeParse(id);
  if (!idOk.success || typeof confirmSlug !== "string") return fail("Invalid request.");
  const db = adminDb();
  if (!db) return fail(NO_DB);

  const { data: album } = await db.from("albums").select("id, slug").eq("id", idOk.data).maybeSingle();
  if (!album) return fail("Album not found.");
  if (confirmSlug.trim() !== album.slug) return fail("The slug you typed does not match.");

  const { data: imgs, error: ie } = await db
    .from("images")
    .select("storage_path")
    .eq("album_id", idOk.data);
  if (ie) return dbFail("deleteAlbum images", ie);
  const paths = new Set((imgs ?? []).map((i) => i.storage_path as string));

  // Also sweep any stray files in the album's folder (e.g. failed uploads).
  const folder = `albums/${idOk.data}`;
  const { data: listed } = await db.storage.from(BUCKET).list(folder, { limit: 1000 });
  for (const f of listed ?? []) if (f.name) paths.add(`${folder}/${f.name}`);

  if (!(await removeStorage(db, [...paths]))) {
    return fail("Could not remove the photo files. Nothing was deleted; please try again.");
  }
  const { error } = await db.from("albums").delete().eq("id", idOk.data);
  if (error) return dbFail("deleteAlbum", error, "Could not delete the album.");
  revalidateGallery([album.slug as string]);
  return { ok: true };
}
