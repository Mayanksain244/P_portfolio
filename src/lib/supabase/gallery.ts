import "server-only";
import { getPublicClient } from "./server";
import type {
  Album,
  AlbumSummary,
  AlbumWithImages,
  GalleryImage,
  ImageRow,
} from "./types";

let warned = false;
function warnOnce(msg: string) {
  if (warned) return;
  warned = true;
  console.warn(`[gallery] ${msg}`);
}

/** True for "table missing / schema not set up" style errors. */
function isMissingSchema(err: { code?: string; message?: string }): boolean {
  return (
    err.code === "42P01" ||
    err.code === "PGRST205" ||
    err.code === "PGRST200" ||
    err.code === "PGRST106" ||
    /does not exist|schema cache/i.test(err.message ?? "")
  );
}

function handleError(err: { code?: string; message?: string }) {
  if (isMissingSchema(err)) {
    warnOnce("Supabase tables not found. Run supabase/migrations/0001_init.sql. Showing empty gallery.");
  } else {
    warnOnce(`Supabase query failed (${err.code ?? "unknown"}): ${err.message ?? ""}`);
  }
}

export function publicImageUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/gallery/${encoded}`;
}

function byOrder(a: ImageRow, b: ImageRow): number {
  return (
    (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
    a.created_at.localeCompare(b.created_at)
  );
}

/** Published albums, newest event first (undated last), then sort_order. */
export async function listPublishedAlbums(): Promise<AlbumSummary[]> {
  const db = getPublicClient();
  if (!db) {
    warnOnce("Supabase env vars missing. Showing empty gallery.");
    return [];
  }
  try {
    const { data: albums, error } = await db
      .from("albums")
      .select("*")
      .eq("published", true)
      .order("event_date", { ascending: false, nullsFirst: false })
      .order("sort_order", { ascending: true });
    if (error) {
      handleError(error);
      return [];
    }
    const list = (albums ?? []) as Album[];
    if (list.length === 0) return [];

    const { data: imgs, error: imgErr } = await db
      .from("images")
      .select("id, album_id, storage_path, blur_data_url, sort_order, created_at")
      .in("album_id", list.map((a) => a.id));
    if (imgErr) {
      handleError(imgErr);
      return [];
    }
    const images = ((imgs ?? []) as ImageRow[]).sort(byOrder);

    return list.map((album) => {
      const own = images.filter((i) => i.album_id === album.id);
      const cover = own.find((i) => i.id === album.cover_image_id) ?? own[0];
      return {
        ...album,
        cover_url: cover ? publicImageUrl(cover.storage_path) : null,
        cover_blur: cover?.blur_data_url ?? null,
        photo_count: own.length,
      };
    });
  } catch (e) {
    warnOnce(`Supabase request failed: ${(e as Error).message}`);
    return [];
  }
}

/** A published album and its images, or null if unknown / unpublished / DB unavailable. */
export async function getAlbumBySlug(slug: string): Promise<AlbumWithImages | null> {
  const db = getPublicClient();
  if (!db) {
    warnOnce("Supabase env vars missing. Showing empty gallery.");
    return null;
  }
  try {
    const { data: album, error } = await db
      .from("albums")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error) {
      handleError(error);
      return null;
    }
    if (!album) return null;
    const a = album as Album;
    const { data: imgs, error: imgErr } = await db
      .from("images")
      .select("*")
      .eq("album_id", a.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (imgErr) {
      handleError(imgErr);
      return null;
    }
    const images: GalleryImage[] = ((imgs ?? []) as ImageRow[])
      .sort(byOrder)
      .map((i) => ({ ...i, url: publicImageUrl(i.storage_path) }));
    const cover = images.find((i) => i.id === a.cover_image_id) ?? images[0];
    return { album: a, images, cover_url: cover?.url ?? null };
  } catch (e) {
    warnOnce(`Supabase request failed: ${(e as Error).message}`);
    return null;
  }
}
