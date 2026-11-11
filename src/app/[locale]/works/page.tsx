import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import DimensionDivider from "@/components/DimensionDivider";
import Reveal from "@/components/Reveal";
import WorksBrowser from "@/components/WorksBrowser";
import { works } from "@/content/works";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "works" });
  return { title: t("title"), description: t("intro") };
}

export default async function WorksPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-heading text-4xl font-semibold sm:text-5xl">
        {t("works.title")}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{t("works.intro")}</p>
      <DimensionDivider title={t("works.title")} as="p" className="mt-10" />
      <Reveal className="mt-10">
        <WorksBrowser works={works} />
      </Reveal>
    </div>
  );
}
