import Link from "next/link";
import AlbumList from "@/components/admin/AlbumList";
import { requireAdmin } from "@/lib/auth/session";
import { listAdminAlbums } from "@/lib/admin/queries";

export const metadata = { title: "Albums" };

export default async function AlbumsPage() {
  await requireAdmin();
  const albums = await listAdminAlbums();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl">Albums</h1>
        <Link href="/admin/albums/new" className="adm-btn adm-btn-primary">
          New album
        </Link>
      </div>
      {albums.length === 0 ? (
        <div className="adm-card p-8 text-center">
          <p className="font-heading text-xl">No albums yet</p>
          <p className="adm-hint mt-1">Create your first album, then add photos to it.</p>
          <Link href="/admin/albums/new" className="adm-btn adm-btn-primary mt-4">
            New album
          </Link>
        </div>
      ) : (
        <AlbumList
          albums={albums.map((a) => ({
            id: a.id,
            slug: a.slug,
            title: a.title_en,
            category: a.category,
            event_date: a.event_date,
            published: !!a.published,
            cover_url: a.cover_url,
            photo_count: a.photo_count,
          }))}
        />
      )}
    </div>
  );
}
