"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { categoryLabel, groupByYear } from "@/lib/diary";
import { ALBUM_CATEGORIES, type AlbumSummary } from "@/lib/supabase/types";
import DiaryCard from "./DiaryCard";
import DimensionDivider from "./DimensionDivider";

function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-10 border-2 border-navy px-4 py-1.5 text-sm font-semibold transition-colors dark:border-paper ${
        pressed
          ? "bg-navy text-paper dark:bg-paper dark:text-navy"
          : "bg-transparent text-navy hover:bg-surface dark:text-paper"
      }`}
    >
      {children}
    </button>
  );
}

/** Category chips plus albums grouped by year. The chosen category lives in `?category=`. */
export default function GalleryBrowser({ albums }: { albums: AlbumSummary[] }) {
  const t = useTranslations("gallery");
  const locale = useLocale();
  const present = ALBUM_CATEGORIES.filter((c) => albums.some((a) => a.category === c));
  const [category, setCategory] = useState<string>("all");

  // Read the shared selection after hydration so the static HTML is the same for everyone.
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("category");
    if (c && (ALBUM_CATEGORIES as readonly string[]).includes(c)) setCategory(c);
  }, []);

  function choose(next: string) {
    setCategory(next);
    const url = new URL(window.location.href);
    if (next === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", next);
    window.history.replaceState(window.history.state, "", url);
  }

  const active = category !== "all" && !present.some((c) => c === category) ? "all" : category;
  const visible = active === "all" ? albums : albums.filter((a) => a.category === active);
  const groups = groupByYear(visible);

  return (
    <div>
      <div
        role="group"
        aria-label={t("filterLabel")}
        className="flex flex-wrap items-center gap-2"
      >
        <Chip pressed={active === "all"} onClick={() => choose("all")}>
          {t("all")}
        </Chip>
        {present.map((c) => (
          <Chip key={c} pressed={active === c} onClick={() => choose(c)}>
            {categoryLabel(c, locale)}
          </Chip>
        ))}
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {t("resultCount", { count: visible.length })}
      </p>

      <div className="mt-10 space-y-14">
        {groups.map((g) => {
          const id = `year-${g.year ?? "undated"}`;
          return (
            <section key={id} aria-labelledby={id}>
              <DimensionDivider
                id={id}
                title={g.year === null ? t("undated") : String(g.year)}
              />
              <ul className="mt-8 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((a) => (
                  <li key={a.id} className="flex">
                    <DiaryCard album={a} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
