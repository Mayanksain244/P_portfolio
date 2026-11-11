"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Dialog from "./Dialog";

export default function UploadLauncher({
  albums,
}: {
  albums: { id: string; title: string }[];
}) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [choice, setChoice] = useState("new");

  function go() {
    ref.current?.close();
    router.push(choice === "new" ? "/admin/albums/new" : `/admin/albums/${choice}#photos`);
  }

  return (
    <>
      <button type="button" className="adm-btn" onClick={() => ref.current?.showModal()}>
        Upload photos
      </button>
      <Dialog ref={ref} title="Upload photos to…">
        <label htmlFor="upload-album" className="adm-label">
          Which album?
        </label>
        <select
          id="upload-album"
          className="adm-input"
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
        >
          <option value="new">+ Create a new album</option>
          {albums.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" className="adm-btn" onClick={() => ref.current?.close()}>
            Cancel
          </button>
          <button type="button" className="adm-btn adm-btn-primary" onClick={go}>
            Continue
          </button>
        </div>
      </Dialog>
    </>
  );
}
