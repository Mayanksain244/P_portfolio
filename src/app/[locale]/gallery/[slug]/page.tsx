import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AlbumGallery from "@/components/AlbumGallery";
import { CameraIcon } from "@/components/DiaryCard";
import { Link } from "@/i18n/navigation";
import { categoryLabel, formatDiaryDate, localized } from "@/lib/diary";
import { getAlbumBySlug } from "@/lib/supabase/gallery";

// Admin actions revalidate with GALLERY_PATHS (src/lib/diary.ts).
export const revalidate = 60;

// No pre-rendered albums: pages are generated on demand and then cached (ISR).
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await getAlbumBySlug(slug);
  if (!data) return {};
  const { album, cover_url } = data;
  const title = localized(album.title_en, album.title_hi, locale);
  const description =
    localized(album.description_en, album.description_hi, locale) || undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(cover_url ? { images: [{ url: cover_url }] } : {}),
    },
  };
}

export default async function AlbumPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const data = await getAlbumBySlug(slug);
  if (!data) notFound();

  const t = await getTranslations("gallery");
  const { album, images } = data;
  const title = localized(album.title_en, album.title_hi, locale);
  const place = localized(album.location_en, album.location_hi, locale);
  const description = localized(album.description_en, album.description_hi, locale);

  return (
    <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/gallery"
        className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-link hover:underline"
      >
        <span aria-hidden="true">←</span>
        {t("back")}
      </Link>

      <header className="mt-4">
        <h1 className="font-heading text-4xl font-semibold sm:text-5xl">{title}</h1>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="diary-stamp text-pine dark:text-marigold">
            {album.event_date ? formatDiaryDate(album.event_date, locale) : t("undated")}
          </span>
          {place && <span className="text-muted">{place}</span>}
          <span className="border-2 border-navy px-2.5 py-0.5 font-semibold dark:border-paper">
            {categoryLabel(album.category, locale)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted">
            <CameraIcon className="h-4 w-4" />
            {t("photoCount", { count: images.length })}
          </span>
        </div>
        {description && (
          <p className="mt-6 max-w-prose text-lg leading-8">{description}</p>
        )}
      </header>

      <div className="mt-10">
        <AlbumGallery images={images} albumTitle={title} />
      </div>
    </article>
  );
}
