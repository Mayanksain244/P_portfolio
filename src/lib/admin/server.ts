import "server-only";
import { revalidatePath } from "next/cache";
import { GALLERY_PATHS } from "@/lib/diary";
import { routing } from "@/i18n/routing";
import { getAdminClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export const BUCKET = "gallery";

export function adminDb(): SupabaseClient | null {
  return getAdminClient();
}

/** Revalidate public gallery pages (both locales) for the given slugs, plus admin pages. */
export function revalidateGallery(slugs: (string | null | undefined)[] = []): void {
  for (const locale of routing.locales) {
    revalidatePath(GALLERY_PATHS.index(locale));
    revalidatePath(GALLERY_PATHS.home(locale));
    for (const slug of new Set(slugs)) {
      if (slug) revalidatePath(GALLERY_PATHS.album(locale, slug));
    }
  }
  revalidatePath("/admin", "layout");
}

/** Sets cover_image_id to the first image if the album has none (or its cover is gone). */
export async function ensureCover(db: SupabaseClient, albumId: string): Promise<void> {
  const { data: album } = await db
    .from("albums")
    .select("cover_image_id")
    .eq("id", albumId)
    .maybeSingle();
  if (!album) return;
  const { data: imgs } = await db
    .from("images")
    .select("id")
    .eq("album_id", albumId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const ids = (imgs ?? []).map((i) => i.id as string);
  const current = album.cover_image_id as string | null;
  if (current && ids.includes(current)) return;
  await db
    .from("albums")
    .update({ cover_image_id: ids[0] ?? null })
    .eq("id", albumId);
}

export async function removeStorage(db: SupabaseClient, paths: string[]): Promise<boolean> {
  if (!paths.length) return true;
  const { error } = await db.storage.from(BUCKET).remove(paths);
  if (error) {
    console.error(`[admin] storage remove: ${error.message}`);
    return false;
  }
  return true;
}
