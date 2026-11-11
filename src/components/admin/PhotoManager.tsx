"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  deleteImages,
  moveImages,
  reorderImages,
  setCover,
} from "@/app/admin/actions/images";
import Dialog from "./Dialog";
import PhotoCard, { type PhotoItem } from "./PhotoCard";
import { useToast } from "./Toast";
import UploadZone from "./UploadZone";

type Props = {
  albumId: string;
  coverId: string | null;
  images: PhotoItem[];
  otherAlbums: { id: string; title: string }[];
};

export default function PhotoManager({ albumId, coverId, images, otherAlbums }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkTarget, setBulkTarget] = useState("");
  const [toDelete, setToDelete] = useState<string[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const confirmRef = useRef<HTMLDialogElement>(null);

  // Local order override, valid only while the server order it was based on is unchanged.
  const serverKey = images.map((i) => i.id).join(",");
  const [override, setOverride] = useState<{ key: string; ids: string[] } | null>(null);
  const byId = new Map(images.map((i) => [i.id, i]));
  const orderIds = override && override.key === serverKey ? override.ids : images.map((i) => i.id);
  const ordered = orderIds.map((id) => byId.get(id)).filter((x): x is PhotoItem => !!x);

  function persistOrder(ids: string[]) {
    setOverride({ key: serverKey, ids });
    start(async () => {
      const r = await reorderImages(albumId, ids);
      if (!r.ok) {
        toast(r.error, "error");
        setOverride(null);
      } else router.refresh();
    });
  }

  function swap(i: number, j: number) {
    if (j < 0 || j >= orderIds.length) return;
    const ids = [...orderIds];
    [ids[i], ids[j]] = [ids[j], ids[i]];
    persistOrder(ids);
  }

  function dragOver(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const ids = orderIds.filter((x) => x !== dragId);
    ids.splice(ids.indexOf(targetId) + (orderIds.indexOf(dragId) < orderIds.indexOf(targetId) ? 1 : 0), 0, dragId);
    if (ids.join() !== orderIds.join()) setOverride({ key: serverKey, ids });
  }

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) {
    start(async () => {
      const r = await fn();
      if (!r.ok) toast(r.error ?? "Something went wrong.", "error");
      else {
        toast(okMsg);
        setSelected(new Set());
        router.refresh();
      }
    });
  }

  function askDelete(ids: string[]) {
    setToDelete(ids);
    confirmRef.current?.showModal();
  }

  function confirmDelete() {
    confirmRef.current?.close();
    const ids = toDelete;
    run(() => deleteImages(ids), ids.length === 1 ? "Photo deleted." : `${ids.length} photos deleted.`);
  }

  const toggle = (id: string, on: boolean) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const sel = [...selected].filter((id) => byId.has(id));
  const albumName = (id: string) => otherAlbums.find((a) => a.id === id)?.title ?? "album";

  return (
    <section id="photos" aria-labelledby="photos-h" className="flex scroll-mt-20 flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="photos-h" className="font-heading text-2xl">
          Photos <span className="adm-hint font-sans text-base">({images.length})</span>
        </h2>
        {ordered.length > 0 && (
          <button
            type="button"
            className="adm-btn adm-btn-sm"
            onClick={() => setSelected(sel.length === ordered.length ? new Set() : new Set(ordered.map((i) => i.id)))}
          >
            {sel.length === ordered.length ? "Clear selection" : "Select all"}
          </button>
        )}
      </div>

      <UploadZone albumId={albumId} />

      {sel.length > 0 && (
        <div
          role="region"
          aria-label="Bulk actions"
          className="adm-card sticky top-[3.75rem] z-20 flex flex-wrap items-end gap-3 p-3 md:top-2"
        >
          <p className="font-semibold">{sel.length} selected</p>
          {otherAlbums.length > 0 && (
            <div className="flex items-end gap-2">
              <div>
                <label htmlFor="bulk-move" className="adm-label">
                  Move to album
                </label>
                <select id="bulk-move" className="adm-input" value={bulkTarget} onChange={(e) => setBulkTarget(e.target.value)}>
                  <option value="">Choose…</option>
                  {otherAlbums.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="adm-btn"
                disabled={!bulkTarget || pending}
                onClick={() =>
                  run(() => moveImages(sel, bulkTarget), `Moved ${sel.length} to ${albumName(bulkTarget)}.`)
                }
              >
                Move
              </button>
            </div>
          )}
          <button type="button" className="adm-btn adm-btn-danger" disabled={pending} onClick={() => askDelete(sel)}>
            Delete selected
          </button>
        </div>
      )}

      {ordered.length === 0 ? (
        <p className="adm-card p-6 text-center text-muted">No photos yet. Add some above.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((photo, i) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={i}
              total={ordered.length}
              isCover={photo.id === coverId}
              selected={selected.has(photo.id)}
              disabled={pending}
              otherAlbums={otherAlbums}
              onSelect={toggle}
              onMoveUp={() => swap(i, i - 1)}
              onMoveDown={() => swap(i, i + 1)}
              onSetCover={() => run(() => setCover(albumId, photo.id), "Cover updated.")}
              onMoveToAlbum={(to) => run(() => moveImages([photo.id], to), `Moved to ${albumName(to)}.`)}
              onDelete={() => askDelete([photo.id])}
              dnd={{
                dragging: dragId === photo.id,
                onDragStart: () => setDragId(photo.id),
                onDragOver: () => dragOver(photo.id),
                onDrop: () => {
                  setDragId(null);
                  persistOrder(orderIds);
                },
                onDragEnd: () => {
                  // Dropped outside a card: restore the saved order.
                  if (dragId) {
                    setDragId(null);
                    setOverride(null);
                  }
                },
              }}
            />
          ))}
        </ul>
      )}

      <Dialog ref={confirmRef} title={toDelete.length === 1 ? "Delete this photo?" : `Delete ${toDelete.length} photos?`}>
        <p className="text-sm">The photo file and its details will be removed permanently. This cannot be undone.</p>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" className="adm-btn" onClick={() => confirmRef.current?.close()}>
            Cancel
          </button>
          <button type="button" className="adm-btn adm-btn-danger-solid" onClick={confirmDelete}>
            Delete
          </button>
        </div>
      </Dialog>
    </section>
  );
}
