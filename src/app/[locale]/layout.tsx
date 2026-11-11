import type { Metadata } from "next";
import { Fraunces, Inter, Noto_Sans_Devanagari } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { profile } from "@/content/profile";
import { pick } from "@/lib/content";
import { routing } from "@/i18n/routing";
import "../globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-devanagari",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const values = {
    name: pick(profile.name, locale),
    designation: pick(profile.designationShort, locale),
    designationFull: pick(profile.designation, locale),
  };
  const image = {
    url: "/images/portrait/portrait-square.webp",
    width: 1200,
    height: 1200,
    alt: pick(profile.portrait?.alt ?? profile.name, locale),
  };
  const title = t("title", values);
  const description = t("description", values);
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    ),
    openGraph: { title, description, type: "website", images: [image] },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
    title: { default: t("title", values), template: t("titleTemplate", values) },
    description: t("description", values),
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("site");

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} ${devanagari.variable}`}
    >
      <body className="flex min-h-screen flex-col antialiased">
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
        <NextIntlClientProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-marigold focus:px-4 focus:py-2 focus:font-semibold focus:text-navy"
          >
            {t("skipToContent")}
          </a>
          <Header />
          <main id="main-content" tabIndex={-1} className="flex-1">
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
