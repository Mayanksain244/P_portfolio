import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ContactCard from "@/components/ContactCard";
import ContactForm from "@/components/ContactForm";
import DimensionDivider from "@/components/DimensionDivider";
import Reveal from "@/components/Reveal";

// The server action sends mail through nodemailer, which needs Node (not edge).
export const runtime = "nodejs";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: t("title"), description: t("intro") };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-heading text-4xl font-semibold sm:text-5xl">{t("title")}</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">{t("intro")}</p>
      <DimensionDivider title={t("formTitle")} as="p" className="mt-10" />

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <Reveal>
          <ContactForm />
        </Reveal>
        <Reveal delay={120}>
          <ContactCard />
        </Reveal>
      </div>
    </div>
  );
}
