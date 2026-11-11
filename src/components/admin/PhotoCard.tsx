"use client";

import { useEffect, useRef, useState } from "react";
import { updateImage } from "@/app/admin/actions/images";
import TagInput from "./TagInput";
import { useToast } from "./Toast";

export type PhotoItem = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  caption_en: string;
  caption_hi: string;
  tags: string[];
  taken_on: string;
};

type Props = {
  photo: PhotoItem;
  index: number;
  total: number;
  isCover: boolean;
  selected: boolean;
  disabled: boolean;
  otherAlbums: { id: string; title: string }[];
  onSelect: (id: string, on: boolean) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSetCover: () => void;
  onMoveToAlbum: (albumId: string) => void;
  onDelete: () => void;
  dnd: {
    onDragStart: () => void;
    onDragOver: () => void;
    onDrop: () => void;
    onDragEnd: () => void;
    dragging: boolean;
  };
};

export default function PhotoCard(p: Props) {
  const { photo } = p;
  const { toast } = useToast();
  const [cEn, setCEn] = useState(photo.caption_en);
  const [cHi, setCHi] = useState(photo.caption_hi);
  const [taken, setTaken] = useState(photo.taken_on);
  const [tags, setTags] = useState(photo.tags);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function save(patch: Record<string, unknown>) {
    const r = await updateImage({ id: photo.id, ...patch });
    if (!r.ok) {
      toast(r.error, "error");
      return;
    }
    setSaved(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 2000);
  }

  const n = p.index + 1;

  return (
    <li
      onDragOver={(e) => {
        e.preventDefault();
        p.dnd.onDragOver();
      }}
      onDrop={(e) => {
        e.preventDefault();
        p.dnd.onDrop();
      }}
      onDragEnd={p.dnd.onDragEnd}
      className={`adm-card flex flex-col gap-3 p-3 ${p.dnd.dragging ? "opacity-40" : ""} ${
        p.selected ? "ring-2 ring-marigold" : ""
      }`}
    >
      <div
        className="relative md:cursor-grab"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", photo.id);
          p.dnd.onDragStart();
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.caption_en || `Photo ${n}`}
          loading="lazy"
          draggable={false}
          className="aspect-[4/3] w-full rounded bg-[var(--surface)] object-cover"
        />
        <label className="absolute left-1 top-1 flex h-11 w-11 cursor-pointer items-center justify-center rounded bg-navy/80">
          <input
            type="checkbox"
            className="h-6 w-6 accent-[#e0a526]"
            checked={p.selected}
            onChange={(e) => p.onSelect(photo.id, e.target.checked)}
            aria-label={`Select photo ${n}`}
          />
        </label>
        {p.isCover && (
          <span className="absolute right-1 top-1 rounded bg-marigold px-2 py-1 text-xs font-bold uppercase tracking-wide text-navy">
            ★ Cover
          </span>
        )}
        <span
          aria-hidden="true"
          className="absolute bottom-1 left-1 hidden rounded bg-navy/80 px-2 py-0.5 text-xs text-paper md:block"
        >
          ⠿ drag to reorder
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="adm-btn adm-btn-sm" aria-label={`Move photo ${n} earlier`} disabled={p.disabled || p.index === 0} onClick={p.onMoveUp}>
          ↑
        </button>
        <button type="button" className="adm-btn adm-btn-sm" aria-label={`Move photo ${n} later`} disabled={p.disabled || p.index === p.total - 1} onClick={p.onMoveDown}>
          ↓
        </button>
        <button
          type="button"
          className="adm-btn adm-btn-sm"
          aria-pressed={p.isCover}
          disabled={p.disabled || p.isCover}
          onClick={p.onSetCover}
        >
          {p.isCover ? "★ Cover" : "☆ Set as cover"}
        </button>
        <span
          className={`adm-hint ml-auto transition-opacity ${saved ? "opacity-100" : "opacity-0"}`}
          role="status"
          aria-live="polite"
        >
          {saved ? "✓ Saved" : ""}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`ce-${photo.id}`} className="adm-label">
            Caption (English)
          </label>
          <input
            id={`ce-${photo.id}`}
            className="adm-input"
            value={cEn}
            maxLength={500}
            onChange={(e) => setCEn(e.target.value)}
            onBlur={() => cEn !== photo.caption_en && save({ caption_en: cEn })}
          />
        </div>
        <div>
          <label htmlFor={`ch-${photo.id}`} className="adm-label">
            Caption (हिन्दी)
          </label>
          <input
            id={`ch-${photo.id}`}
            lang="hi"
            className="adm-input"
            value={cHi}
            maxLength={500}
            onChange={(e) => setCHi(e.target.value)}
            onBlur={() => cHi !== photo.caption_hi && save({ caption_hi: cHi })}
          />
        </div>
      </div>

      <TagInput
        tags={tags}
        onChange={(t) => {
          setTags(t);
          void save({ tags: t });
        }}
      />

      <div>
        <label htmlFor={`td-${photo.id}`} className="adm-label">
          Date taken
        </label>
        <input
          id={`td-${photo.id}`}
          type="date"
          className="adm-input"
          value={taken}
          onChange={(e) => setTaken(e.target.value)}
          onBlur={() => taken !== photo.taken_on && save({ taken_on: taken })}
        />
      </div>

      <div className="flex flex-wrap items-end gap-2 border-t border-[var(--rule)] pt-3">
        {p.otherAlbums.length > 0 && (
          <div className="min-w-0 flex-1">
            <label htmlFor={`mv-${photo.id}`} className="adm-label">
              Move to album
            </label>
            <select
              id={`mv-${photo.id}`}
              className="adm-input"
              disabled={p.disabled}
              value=""
              onChange={(e) => e.target.value && p.onMoveToAlbum(e.target.value)}
            >
              <option value="">Choose…</option>
              {p.otherAlbums.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <button type="button" className="adm-btn adm-btn-danger" disabled={p.disabled} onClick={p.onDelete}>
          Delete
        </button>
      </div>
    </li>
  );
}
