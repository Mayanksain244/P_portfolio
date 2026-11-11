import Link from "next/link";
import { notFound } from "next/navigation";
import AlbumForm from "@/components/admin/AlbumForm";
import DeleteAlbum from "@/components/admin/DeleteAlbum";
import PhotoManager from "@/components/admin/PhotoManager";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminAlbum, listAdminAlbums } from "@/lib/admin/queries";
import { idSchema } from "@/lib/admin/schemas";

export const metadata = { title: "Edit album" };

export default async function EditAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  const [data, albums] = await Promise.all([getAdminAlbum(id), listAdminAlbums()]);
  if (!data) notFound();
  const { album, images } = data;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/albums" className="text-sm font-semibold underline">
            ← Albums
          </Link>
          <h1 className="font-heading mt-2 text-3xl">{album.title_en}</h1>
        </div>
        {album.published && (
          <a href={`/en/gallery/${album.slug}`} target="_blank" rel="noopener" className="adm-btn adm-btn-sm">
            View on site ↗
          </a>
        )}
      </div>

      <AlbumForm album={album} />

      <PhotoManager
        albumId={album.id}
        coverId={album.cover_image_id}
        images={images.map((i) => ({
          id: i.id,
          url: i.url,
          width: i.width,
          height: i.height,
          caption_en: i.caption_en ?? "",
          caption_hi: i.caption_hi ?? "",
          tags: i.tags ?? [],
          taken_on: i.taken_on ?? "",
        }))}
        otherAlbums={albums.filter((a) => a.id !== album.id).map((a) => ({ id: a.id, title: a.title_en }))}
      />

      <section aria-labelledby="danger" className="adm-card p-4 sm:p-6" style={{ borderColor: "var(--adm-danger)" }}>
        <h2 id="danger" className="font-heading text-xl">
          Delete this album
        </h2>
        <p className="adm-hint mt-1">
          Permanently removes the album, its {images.length} photo{images.length === 1 ? "" : "s"} and the files. This cannot be undone.
        </p>
        <DeleteAlbum id={album.id} slug={album.slug} />
      </section>
    </div>
  );
}
