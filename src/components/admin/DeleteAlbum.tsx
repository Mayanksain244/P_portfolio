"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { deleteAlbum } from "@/app/admin/actions/albums";
import Dialog from "./Dialog";
import { useToast } from "./Toast";

export default function DeleteAlbum({ id, slug }: { id: string; slug: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const ref = useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function confirm() {
    setError("");
    start(async () => {
      const r = await deleteAlbum(id, typed);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      toast("Album deleted.");
      ref.current?.close();
      router.replace("/admin/albums");
    });
  }

  return (
    <>
      <button type="button" className="adm-btn adm-btn-danger mt-4" onClick={() => ref.current?.showModal()}>
        Delete album…
      </button>
      <Dialog ref={ref} title="Delete this album?">
        <p className="text-sm">
          This removes the album and every photo in it. To confirm, type the slug{" "}
          <code className="font-bold">{slug}</code> below.
        </p>
        <label htmlFor="confirm-slug" className="adm-label mt-4">
          Album slug
        </label>
        <input
          id="confirm-slug"
          className="adm-input"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
        />
        {error && (
          <p role="alert" className="adm-err mt-2">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" className="adm-btn" onClick={() => ref.current?.close()}>
            Cancel
          </button>
          <button
            type="button"
            className="adm-btn adm-btn-danger-solid"
            disabled={pending || typed.trim() !== slug}
            onClick={confirm}
          >
            {pending ? "Deleting…" : "Delete forever"}
          </button>
        </div>
      </Dialog>
    </>
  );
}
