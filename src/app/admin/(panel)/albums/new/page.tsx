import Link from "next/link";
import AlbumForm from "@/components/admin/AlbumForm";
import { requireAdmin } from "@/lib/auth/session";

export const metadata = { title: "New album" };

export default async function NewAlbumPage() {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/albums" className="text-sm font-semibold underline">
          ← Albums
        </Link>
        <h1 className="font-heading mt-2 text-3xl">New album</h1>
        <p className="adm-hint mt-1">Fill in the details first; you can add photos right after saving.</p>
      </div>
      <AlbumForm />
    </div>
  );
}
