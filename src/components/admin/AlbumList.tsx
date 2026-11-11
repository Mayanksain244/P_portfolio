"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { moveAlbum, setAlbumPublished } from "@/app/admin/actions/albums";
import { formatDay } from "@/lib/admin/format";
import { CATEGORY_LABELS, type AlbumCategory } from "@/lib/supabase/types";
import { useToast } from "./Toast";

export type AlbumRow = {
  id: string;
  slug: string;
  title: string;
  category: AlbumCategory;
  event_date: string | null;
  published: boolean;
  cover_url: string | null;
  photo_count: number;
};

export default function AlbumList({ albums }: { albums: AlbumRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");

  function run(id: string, fn: () => Promise<{ ok: boolean; error?: string }>, okMsg?: string) {
    setBusyId(id);
    start(async () => {
      const r = await fn();
      setBusyId(null);
      if (!r.ok) toast(r.error ?? "Something went wrong.", "error");
      else {
        if (okMsg) setAnnounce(okMsg);
        router.refresh();
      }
    });
  }

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>
      <ul className="flex flex-col gap-3">
        {albums.map((a, i) => (
          <li key={a.id} className="adm-card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href={`/admin/albums/${a.id}`}
              className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4"
            >
              {a.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.cover_url}
                  alt=""
                  loading="lazy"
                  className="h-16 w-20 shrink-0 rounded object-cover sm:h-20 sm:w-28"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-16 w-20 shrink-0 items-center justify-center rounded bg-[var(--surface)] text-xs text-muted sm:h-20 sm:w-28"
                >
                  No cover
                </span>
              )}
              <span className="min-w-0">
                <span className="font-heading block truncate text-lg font-semibold">{a.title}</span>
                <span className="adm-hint block">
                  {CATEGORY_LABELS[a.category]?.en ?? a.category} · {formatDay(a.event_date)}
                </span>
                <span className="adm-hint block">
                  {a.photo_count} {a.photo_count === 1 ? "photo" : "photos"}
                </span>
              </span>
            </Link>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <button
                  type="button"
                  role="switch"
                  aria-checked={a.published}
                  aria-label={`Published: ${a.title}`}
                  className="adm-switch"
                  disabled={pending && busyId === a.id}
                  onClick={() =>
                    run(
                      a.id,
                      () => setAlbumPublished(a.id, !a.published),
                      `${a.title} is now ${a.published ? "a draft" : "published"}.`,
                    )
                  }
                />
                <span className={`adm-badge ${a.published ? "adm-badge-live" : "adm-badge-draft"}`}>
                  {a.published ? "Published" : "Draft"}
                </span>
              </div>
              <div className="flex gap-2" role="group" aria-label={`Reorder ${a.title}`}>
                <button
                  type="button"
                  className="adm-btn adm-btn-sm"
                  aria-label={`Move ${a.title} up`}
                  disabled={i === 0 || pending}
                  onClick={() => run(a.id, () => moveAlbum(a.id, "up"), `${a.title} moved up to position ${i}.`)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn-sm"
                  aria-label={`Move ${a.title} down`}
                  disabled={i === albums.length - 1 || pending}
                  onClick={() =>
                    run(a.id, () => moveAlbum(a.id, "down"), `${a.title} moved down to position ${i + 2}.`)
                  }
                >
                  ↓
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
