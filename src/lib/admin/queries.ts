import "server-only";
import { publicImageUrl } from "@/lib/supabase/gallery";
import type { Album, ImageRow, Message } from "@/lib/supabase/types";
import { adminDb } from "./server";

export type AdminAlbum = Album & {
  cover_url: string | null;
  photo_count: number;
};
export type AdminImage = ImageRow & { url: string };

export const MESSAGES_PER_PAGE = 20;

function log(ctx: string, err: { code?: string; message?: string }) {
  console.error(`[admin] ${ctx}: ${err.code ?? ""} ${err.message ?? ""}`);
}

/** Admin ordering: sort_order asc, newest first on ties. */
export async function listAdminAlbums(): Promise<AdminAlbum[]> {
  const db = adminDb();
  if (!db) return [];
  const [{ data: albums, error }, { data: imgs }] = await Promise.all([
    db
      .from("albums")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    db.from("images").select("id, album_id, storage_path"),
  ]);
  if (error) {
    log("listAdminAlbums", error);
    return [];
  }
  const counts = new Map<string, number>();
  const paths = new Map<string, string>();
  for (const i of imgs ?? []) {
    counts.set(i.album_id, (counts.get(i.album_id) ?? 0) + 1);
    paths.set(i.id, i.storage_path);
  }
  return ((albums ?? []) as Album[]).map((a) => {
    const p = a.cover_image_id ? paths.get(a.cover_image_id) : undefined;
    return {
      ...a,
      cover_url: p ? publicImageUrl(p) : null,
      photo_count: counts.get(a.id) ?? 0,
    };
  });
}

export async function getAdminAlbum(
  id: string,
): Promise<{ album: Album; images: AdminImage[] } | null> {
  const db = adminDb();
  if (!db) return null;
  const { data: album, error } = await db.from("albums").select("*").eq("id", id).maybeSingle();
  if (error || !album) {
    if (error) log("getAdminAlbum", error);
    return null;
  }
  const { data: imgs } = await db
    .from("images")
    .select("*")
    .eq("album_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return {
    album: album as Album,
    images: ((imgs ?? []) as ImageRow[]).map((i) => ({
      ...i,
      url: publicImageUrl(i.storage_path),
    })),
  };
}

export type DashboardData = {
  albumsPublished: number;
  albumsDraft: number;
  photos: number;
  unread: number;
  latest: Message[];
  dbOk: boolean;
};

export async function getDashboard(): Promise<DashboardData> {
  const db = adminDb();
  const empty: DashboardData = {
    albumsPublished: 0,
    albumsDraft: 0,
    photos: 0,
    unread: 0,
    latest: [],
    dbOk: false,
  };
  if (!db) return empty;
  const count = (q: PromiseLike<{ count: number | null; error: unknown }>) =>
    Promise.resolve(q).then((r) => (r.error ? null : (r.count ?? 0)));
  const [pub, draft, photos, unread, latest] = await Promise.all([
    count(db.from("albums").select("id", { count: "exact", head: true }).eq("published", true)),
    count(db.from("albums").select("id", { count: "exact", head: true }).not("published", "is", true)),
    count(db.from("images").select("id", { count: "exact", head: true })),
    count(db.from("messages").select("id", { count: "exact", head: true }).eq("read", false)),
    db.from("messages").select("*").order("created_at", { ascending: false }).limit(5),
  ]);
  return {
    albumsPublished: pub ?? 0,
    albumsDraft: draft ?? 0,
    photos: photos ?? 0,
    unread: unread ?? 0,
    latest: (latest.data ?? []) as Message[],
    dbOk: pub !== null,
  };
}

export async function listMessages(
  page: number,
): Promise<{ items: Message[]; total: number }> {
  const db = adminDb();
  if (!db) return { items: [], total: 0 };
  const from = (page - 1) * MESSAGES_PER_PAGE;
  const { data, count, error } = await db
    .from("messages")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + MESSAGES_PER_PAGE - 1);
  if (error) {
    log("listMessages", error);
    return { items: [], total: 0 };
  }
  return { items: (data ?? []) as Message[], total: count ?? 0 };
}

export async function getMessage(id: string): Promise<Message | null> {
  const db = adminDb();
  if (!db) return null;
  const { data, error } = await db.from("messages").select("*").eq("id", id).maybeSingle();
  if (error) log("getMessage", error);
  return (data as Message | null) ?? null;
}
