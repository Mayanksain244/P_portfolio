"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { addImage, createUploadUrl, discardUpload } from "@/app/admin/actions/images";
import { processImage, UnsupportedImageError } from "@/lib/admin/processImage";
import { getBrowserClient } from "@/lib/supabase/browser";

type Status = "queued" | "processing" | "uploading" | "saving" | "done" | "error";
type Item = { id: number; name: string; status: Status; error?: string };

const CONCURRENCY = 3;
const PCT: Record<Status, number> = { queued: 5, processing: 25, uploading: 60, saving: 90, done: 100, error: 100 };
const LABEL: Record<Status, string> = {
  queued: "Waiting…",
  processing: "Preparing…",
  uploading: "Uploading…",
  saving: "Saving…",
  done: "Done",
  error: "Failed",
};

export default function UploadZone({ albumId }: { albumId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const files = useRef(new Map<number, File>());
  const pending = useRef<number[]>([]);
  const active = useRef(0);
  const nextId = useRef(1);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const patch = useCallback((id: number, p: Partial<Item>) => {
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, ...p } : i)));
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => router.refresh(), 500);
  }, [router]);

  useEffect(
    () => () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    },
    [],
  );

  const processOne = useCallback(
    async (id: number) => {
      const file = files.current.get(id);
      if (!file) return;
      let uploadedPath: string | null = null;
      try {
        patch(id, { status: "processing", error: undefined });
        const img = await processImage(file);

        patch(id, { status: "uploading" });
        const signed = await createUploadUrl(albumId, img.ext);
        if (!signed.ok) throw new Error(signed.error);
        const { error: upErr } = await getBrowserClient()
          .storage.from("gallery")
          .uploadToSignedUrl(signed.path, signed.token, img.blob, { contentType: img.contentType });
        if (upErr) throw new Error("The upload failed. Check your connection and retry.");
        uploadedPath = signed.path;

        patch(id, { status: "saving" });
        const saved = await addImage({
          albumId,
          path: signed.path,
          width: img.width,
          height: img.height,
          blur: img.blur,
        });
        if (!saved.ok) throw new Error(saved.error);
        uploadedPath = null;
        files.current.delete(id);
        patch(id, { status: "done" });
        scheduleRefresh();
      } catch (e) {
        if (uploadedPath) void discardUpload(albumId, uploadedPath).catch(() => {});
        const msg =
          e instanceof UnsupportedImageError
            ? e.message
            : e instanceof Error && e.message
              ? e.message
              : "Something went wrong.";
        patch(id, { status: "error", error: msg });
      }
    },
    [albumId, patch, scheduleRefresh],
  );

  const pump = useCallback(() => {
    while (active.current < CONCURRENCY && pending.current.length) {
      const id = pending.current.shift()!;
      active.current++;
      void processOne(id).finally(() => {
        active.current--;
        pump();
      });
    }
  }, [processOne]);

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      const images = [...list].filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
      if (!images.length) return;
      const added: Item[] = images.map((f) => {
        const id = nextId.current++;
        files.current.set(id, f);
        pending.current.push(id);
        return { id, name: f.name, status: "queued" };
      });
      setItems((cur) => [...cur, ...added]);
      pump();
    },
    [pump],
  );

  function retry(id: number) {
    patch(id, { status: "queued", error: undefined });
    pending.current.push(id);
    pump();
  }

  const busy = items.some((i) => i.status !== "done" && i.status !== "error");

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setDragging(true);
          }
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center gap-3 rounded-md border-2 border-dashed p-6 text-center ${
          dragging ? "border-marigold bg-[var(--surface)]" : "border-[var(--adm-field-border)]"
        }`}
      >
        <p className="font-semibold">Drag photos here</p>
        <p className="adm-hint">or use the button. On a phone you can take a new photo or pick from the gallery.</p>
        <input
          ref={input}
          id="photo-input"
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <label htmlFor="photo-input" className="adm-btn adm-btn-primary cursor-pointer">
          Choose photos
        </label>
      </div>

      {items.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Upload progress">
          {items.map((i) => (
            <li key={i.id} className="adm-card flex flex-col gap-1 p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-semibold">{i.name}</span>
                <span className={i.status === "error" ? "adm-err" : "adm-hint"} role={i.status === "error" ? "alert" : undefined}>
                  {LABEL[i.status]}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={`${i.name} progress`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={PCT[i.status]}
                className="h-2 overflow-hidden rounded bg-[var(--surface)]"
              >
                <div
                  className="h-full transition-[width] duration-300"
                  style={{
                    width: `${PCT[i.status]}%`,
                    background: i.status === "error" ? "var(--adm-danger)" : i.status === "done" ? "var(--color-pine)" : "var(--color-marigold)",
                  }}
                />
              </div>
              {i.status === "error" && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="adm-err">{i.error}</p>
                  {files.current.has(i.id) && !/format isn't supported/.test(i.error ?? "") && (
                    <button type="button" className="adm-btn adm-btn-sm" onClick={() => retry(i.id)}>
                      Retry
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
          {!busy && (
            <li>
              <button type="button" className="adm-btn adm-btn-sm" onClick={() => setItems((c) => c.filter((i) => i.status === "error"))}>
                Clear finished
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
