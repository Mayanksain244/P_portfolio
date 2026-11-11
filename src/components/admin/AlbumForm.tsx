"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createAlbum, updateAlbum } from "@/app/admin/actions/albums";
import { slugify } from "@/lib/slug";
import { ALBUM_CATEGORIES, CATEGORY_LABELS, type Album, type AlbumCategory } from "@/lib/supabase/types";
import { useToast } from "./Toast";

type Values = {
  title_en: string;
  title_hi: string;
  slug: string;
  category: AlbumCategory;
  event_date: string;
  location_en: string;
  location_hi: string;
  description_en: string;
  description_hi: string;
  published: boolean;
};

function fromAlbum(a?: Album): Values {
  return {
    title_en: a?.title_en ?? "",
    title_hi: a?.title_hi ?? "",
    slug: a?.slug ?? "",
    category: a?.category ?? "other",
    event_date: a?.event_date ?? "",
    location_en: a?.location_en ?? "",
    location_hi: a?.location_hi ?? "",
    description_en: a?.description_en ?? "",
    description_hi: a?.description_hi ?? "",
    published: a?.published ?? false,
  };
}

function Field({
  label,
  id,
  error,
  hint,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="adm-label">
        {label}
      </label>
      {children}
      {hint && !error && <p className="adm-hint mt-1">{hint}</p>}
      {error && (
        <p id={`${id}-err`} className="adm-err mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function AlbumForm({ album }: { album?: Album }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [v, setV] = useState<Values>(() => fromAlbum(album));
  // For an existing album the slug is "touched" (never auto-changed unless the owner edits it).
  const [slugTouched, setSlugTouched] = useState(!!album);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof Values>(k: K, val: Values[K]) => setV((cur) => ({ ...cur, [k]: val }));

  function onTitleEn(val: string) {
    setV((cur) => ({ ...cur, title_en: val, slug: slugTouched ? cur.slug : slugify(val) }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    start(async () => {
      const r = album ? await updateAlbum(album.id, v) : await createAlbum(v);
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        toast(r.error, "error");
        return;
      }
      toast(album ? "Album saved." : "Album created. Now add photos.");
      if (!album && "id" in r) router.replace(`/admin/albums/${r.id}#photos`);
      else router.refresh();
    });
  }

  const inv = (k: string) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `${k}-err` } : {});

  return (
    <form onSubmit={submit} className="adm-card flex flex-col gap-5 p-4 sm:p-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title (English) *" id="title_en" error={errors.title_en}>
          <input id="title_en" className="adm-input" required value={v.title_en} onChange={(e) => onTitleEn(e.target.value)} {...inv("title_en")} />
        </Field>
        <Field label="Title (हिन्दी)" id="title_hi" error={errors.title_hi}>
          <input id="title_hi" lang="hi" className="adm-input" value={v.title_hi} onChange={(e) => set("title_hi", e.target.value)} {...inv("title_hi")} />
        </Field>
      </div>

      <Field label="Slug" id="slug" error={errors.slug} hint={`Web address: /gallery/${v.slug || "…"}`}>
        <input
          id="slug"
          className="adm-input"
          autoCapitalize="none"
          spellCheck={false}
          value={v.slug}
          onChange={(e) => {
            setSlugTouched(true);
            set("slug", e.target.value);
          }}
          {...inv("slug")}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" id="category" error={errors.category}>
          <select id="category" className="adm-input" value={v.category} onChange={(e) => set("category", e.target.value as AlbumCategory)}>
            {ALBUM_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c].en}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Event date" id="event_date" error={errors.event_date}>
          <input id="event_date" type="date" className="adm-input" value={v.event_date} onChange={(e) => set("event_date", e.target.value)} {...inv("event_date")} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Location (English)" id="location_en" error={errors.location_en}>
          <input id="location_en" className="adm-input" value={v.location_en} onChange={(e) => set("location_en", e.target.value)} />
        </Field>
        <Field label="Location (हिन्दी)" id="location_hi" error={errors.location_hi}>
          <input id="location_hi" lang="hi" className="adm-input" value={v.location_hi} onChange={(e) => set("location_hi", e.target.value)} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Description (English)" id="description_en" error={errors.description_en}>
          <textarea id="description_en" className="adm-input" value={v.description_en} onChange={(e) => set("description_en", e.target.value)} />
        </Field>
        <Field label="Description (हिन्दी)" id="description_hi" error={errors.description_hi}>
          <textarea id="description_hi" lang="hi" className="adm-input" value={v.description_hi} onChange={(e) => set("description_hi", e.target.value)} />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          id="published"
          aria-checked={v.published}
          aria-labelledby="published-label"
          className="adm-switch"
          onClick={() => set("published", !v.published)}
        />
        <span id="published-label" className="text-base font-semibold">
          {v.published ? "Published — visible on the site" : "Draft — hidden from the site"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--rule)] pt-4">
        <button type="submit" disabled={pending} className="adm-btn adm-btn-primary">
          {pending ? "Saving…" : album ? "Save changes" : "Create album"}
        </button>
        <button type="button" className="adm-btn" onClick={() => router.push("/admin/albums")}>
          {album ? "Back to albums" : "Cancel"}
        </button>
      </div>
    </form>
  );
}
