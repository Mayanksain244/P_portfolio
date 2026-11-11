import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import DiaryEmpty from "@/components/DiaryEmpty";
import DimensionDivider from "@/components/DimensionDivider";
import GalleryBrowser from "@/components/GalleryBrowser";
import Reveal from "@/components/Reveal";
import { listPublishedAlbums } from "@/lib/supabase/gallery";

// Admin actions revalidate with GALLERY_PATHS (src/lib/diary.ts).
export const revalidate = 60;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gallery" });
  return { title: t("title"), description: t("intro") };
}

export default async function GalleryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const albums = await listPublishedAlbums();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-heading text-4xl font-semibold sm:text-5xl">
        {t("gallery.title")}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{t("gallery.intro")}</p>
      <DimensionDivider title={t("gallery.title")} as="p" className="mt-10" />
      <Reveal className="mt-10">
        {albums.length === 0 ? <DiaryEmpty /> : <GalleryBrowser albums={albums} />}
      </Reveal>
    </div>
  );
}
