import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { categoryLabel, formatDiaryDate, localized } from "@/lib/diary";
import type { AlbumSummary } from "@/lib/supabase/types";
import BlueprintGrid from "./BlueprintGrid";

export function CameraIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 8h3l1.6-2.4h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.6" />
    </svg>
  );
}

/** Site-diary entry: cover photo with a "survey tag" strip underneath. The whole card is one link. */
export default function DiaryCard({
  album,
  compact = false,
}: {
  album: AlbumSummary;
  compact?: boolean;
}) {
  const t = useTranslations("gallery");
  const locale = useLocale();
  const title = localized(album.title_en, album.title_hi, locale);
  const place = localized(album.location_en, album.location_hi, locale);

  return (
    <article className="group relative flex w-full flex-col border-2 border-navy bg-background text-foreground transition duration-200 focus-within:-translate-y-1 focus-within:shadow-lg hover:-translate-y-1 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-paper">
      <div className="relative aspect-[4/3] border-b-2 border-navy dark:border-paper">
        {album.cover_url ? (
          <Image
            src={album.cover_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            {...(album.cover_blur
              ? { placeholder: "blur" as const, blurDataURL: album.cover_blur }
              : {})}
          />
        ) : (
          <BlueprintGrid className="flex h-full w-full items-center justify-center bg-surface/50 text-navy dark:text-paper">
            <CameraIcon className="h-12 w-12 opacity-70" />
          </BlueprintGrid>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-dashed border-navy/50 pb-2 text-xs dark:border-paper/50">
          <span className="diary-stamp text-pine dark:text-marigold">
            {album.event_date ? formatDiaryDate(album.event_date, locale) : t("undated")}
          </span>
          <span className="inline-flex items-center gap-1.5 border border-navy/60 px-1.5 py-0.5 font-semibold dark:border-paper/60">
            <CameraIcon className="h-3.5 w-3.5" />
            <span className="sr-only">{t("photoCount", { count: album.photo_count })}</span>
            <span aria-hidden="true">{album.photo_count}</span>
          </span>
        </div>
        <p className="diary-stamp text-[0.7rem] text-muted">
          {categoryLabel(album.category, locale)}
        </p>
        <h3
          className={`font-heading font-semibold leading-snug ${
            compact ? "text-lg" : "text-xl"
          }`}
        >
          <Link
            href={`/gallery/${album.slug}`}
            className="after:absolute after:inset-0 hover:underline"
          >
            {title}
          </Link>
        </h3>
        {place && !compact && <p className="text-sm text-muted">{place}</p>}
      </div>
    </article>
  );
}
