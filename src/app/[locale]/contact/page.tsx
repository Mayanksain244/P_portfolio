import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PagePlaceholder from "@/components/PagePlaceholder";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: t("title"), description: t("intro") };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  return (
    <PagePlaceholder
      title={t("contact.title")}
      intro={t("contact.intro")}
      panelLabel={t("comingSoon.label")}
      panelTitle={t("comingSoon.title")}
      panelText={t("comingSoon.text")}
    />
  );
}
