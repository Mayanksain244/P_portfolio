"use client";

import { useTranslations } from "next-intl";
import { useId, useState, type ReactNode } from "react";
import { WORK_STATUSES, WORK_TYPES, type Work } from "@/content/works";
import { Link } from "@/i18n/navigation";
import { filterWorks, toggle, type WorkFilters } from "@/lib/works";
import BlueprintGrid from "./BlueprintGrid";
import WorkCard from "./WorkCard";

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

export function EmptyRegister() {
  const t = useTranslations("works");
  return (
    <BlueprintGrid className="border-2 border-navy p-1 text-navy dark:border-paper dark:text-paper">
      <section
        aria-labelledby="register-empty-title"
        className="flex min-h-72 flex-col items-center justify-center gap-3 border border-current/40 bg-background/85 px-6 py-12 text-center text-foreground"
      >
        <p className="dim-title text-xs font-semibold text-pine dark:text-marigold">
          {t("emptyLabel")}
        </p>
        <h2
          id="register-empty-title"
          className="font-heading text-3xl font-semibold"
        >
          {t("emptyTitle")}
        </h2>
        <p className="max-w-md text-muted">{t("emptyText")}</p>
        <Link href="/#journey" className="btn btn-primary mt-3">
          {t("emptyLink")}
        </Link>
      </section>
    </BlueprintGrid>
  );
}

export default function WorksBrowser({ works }: { works: Work[] }) {
  const t = useTranslations("works");
  const uid = useId();
  const [filters, setFilters] = useState<WorkFilters>({
    types: [],
    statuses: [],
  });

  if (works.length === 0) return <EmptyRegister />;

  // Project numbers come from the full register so they don't shift when filtering.
  const visible = filterWorks(works, filters);
  const presentTypes = WORK_TYPES.filter((ty) =>
    works.some((w) => w.type === ty),
  );
  const presentStatuses = WORK_STATUSES.filter((s) =>
    works.some((w) => w.status === s),
  );
  const isFiltered = filters.types.length > 0 || filters.statuses.length > 0;

  return (
    <div>
      <div role="group" aria-label={t("filterLabel")} className="space-y-4">
        <div
          role="group"
          aria-labelledby={`${uid}-type`}
          className="flex flex-wrap items-center gap-2"
        >
          <span
            id={`${uid}-type`}
            className="dim-title mr-2 text-xs font-semibold text-muted"
          >
            {t("typeGroup")}
          </span>
          <Chip
            pressed={filters.types.length === 0}
            onClick={() => setFilters((f) => ({ ...f, types: [] }))}
          >
            {t("all")}
          </Chip>
          {presentTypes.map((ty) => (
            <Chip
              key={ty}
              pressed={filters.types.includes(ty)}
              onClick={() =>
                setFilters((f) => ({ ...f, types: toggle(f.types, ty) }))
              }
            >
              {t(`type.${ty}`)}
            </Chip>
          ))}
        </div>
        <div
          role="group"
          aria-labelledby={`${uid}-status`}
          className="flex flex-wrap items-center gap-2"
        >
          <span
            id={`${uid}-status`}
            className="dim-title mr-2 text-xs font-semibold text-muted"
          >
            {t("statusGroup")}
          </span>
          <Chip
            pressed={filters.statuses.length === 0}
            onClick={() => setFilters((f) => ({ ...f, statuses: [] }))}
          >
            {t("all")}
          </Chip>
          {presentStatuses.map((s) => (
            <Chip
              key={s}
              pressed={filters.statuses.includes(s)}
              onClick={() =>
                setFilters((f) => ({ ...f, statuses: toggle(f.statuses, s) }))
              }
            >
              {t(`status.${s}`)}
            </Chip>
          ))}
        </div>
      </div>

      <p role="status" aria-live="polite" className="mt-6 text-sm text-muted">
        {t("resultCount", { count: visible.length })}
      </p>

      {visible.length === 0 ? (
        <div className="mt-6 border-2 border-dashed border-navy/50 p-10 text-center dark:border-paper/50">
          <p className="text-muted">{t("noMatches")}</p>
          {isFiltered && (
            <button
              type="button"
              className="btn btn-primary mt-4"
              onClick={() => setFilters({ types: [], statuses: [] })}
            >
              {t("clearFilters")}
            </button>
          )}
        </div>
      ) : (
        <ul className="mt-6 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((work) => (
            <li key={work.slug} className="flex">
              <WorkCard work={work} index={works.indexOf(work) + 1} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
