import { getTranslations, setRequestLocale } from "next-intl/server";
import ContourBackground from "@/components/ContourBackground";
import DiaryCard from "@/components/DiaryCard";
import DimensionDivider from "@/components/DimensionDivider";
import DataSheet from "@/components/DataSheet";
import Hero from "@/components/Hero";
import Reveal from "@/components/Reveal";
import ServiceJourney from "@/components/ServiceJourney";
import StatsStrip from "@/components/StatsStrip";
import WorkCard from "@/components/WorkCard";
import { profile } from "@/content/profile";
import { works } from "@/content/works";
import { Link } from "@/i18n/navigation";
import { pick } from "@/lib/content";
import { listPublishedAlbums } from "@/lib/supabase/gallery";
import { districtCount, yearsOfService } from "@/lib/stats";

// "Years of service" is computed per request, so the page must not be frozen at build time.
export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const years = yearsOfService(profile.serviceStartYear);
  const featured = works.filter((w) => w.featured);
  const latestAlbums = (await listPublishedAlbums()).slice(0, 3);

  return (
    <>
      {/* 1. Hero */}
      <Hero locale={locale} />

      {/* 2. At a glance */}
      <section
        aria-labelledby="glance-title"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6"
      >
        <Reveal>
          <DimensionDivider id="glance-title" title={t("stats.title")} />
          <div className="mt-12">
            <StatsStrip
              stats={[
                { value: `${years}+`, label: t("stats.years") },
                { value: String(profile.postings.length), label: t("stats.postings") },
                { value: String(districtCount(profile.postings)), label: t("stats.districts") },
                { value: String(profile.serviceStartYear), label: t("stats.since") },
              ]}
            />
          </div>
        </Reveal>
      </section>

      {/* 3. About */}
      <section
        aria-labelledby="about-title"
        className="mx-auto max-w-6xl px-4 pb-20 sm:px-6"
      >
        <Reveal>
          <DimensionDivider id="about-title" title={t("about.title")} />
          <div className="mt-12 grid items-start gap-10 md:grid-cols-[1fr_24rem] lg:grid-cols-[1fr_28rem] lg:gap-16">
            <p lang={locale} className="max-w-prose text-lg leading-8">
              {pick(profile.bio, locale)}
            </p>
            <div className="w-full">
              <DataSheet />
            </div>
          </div>
        </Reveal>
      </section>

      {/* 4. Service Journey */}
      <section
        id="journey"
        aria-labelledby="journey-title"
        className="scroll-mt-16 bg-surface py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <DimensionDivider id="journey-title" title={t("journey.title")} />
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-muted">
              {t("journey.intro")}
            </p>
          </Reveal>
          <div className="mt-12">
            <ServiceJourney years={years} />
          </div>
        </div>
      </section>

      {/* 5. Featured works (hidden until some are flagged) */}
      {featured.length > 0 && (
        <section
          aria-labelledby="featured-title"
          className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20"
        >
          <Reveal>
            <DimensionDivider id="featured-title" title={t("featured.title")} />
            <ul className="mt-12 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((w) => (
                <li key={w.slug} className="flex">
                  <WorkCard work={w} index={works.indexOf(w) + 1} />
                </li>
              ))}
            </ul>
            <p className="mt-10 text-center">
              <Link href="/works" className="btn btn-primary">
                {t("featured.viewAll")}
              </Link>
            </p>
          </Reveal>
        </section>
      )}

      {/* 6. Site Diary teaser */}
      <section
        aria-labelledby="diary-title"
        className="relative overflow-hidden bg-navy py-16 text-paper dark:bg-navy-900 sm:py-20"
      >
        <ContourBackground className="text-paper opacity-[0.08]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <DimensionDivider id="diary-title" title={t("diary.title")} onDark />
            <p className="mx-auto mt-8 max-w-xl text-center text-lg text-paper/90">
              {t("diary.text")}
            </p>
            {latestAlbums.length > 0 && (
              <ul className="mt-10 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3" aria-label={t("diary.latest")}>
                {latestAlbums.map((a) => (
                  <li key={a.id} className="flex">
                    <DiaryCard album={a} compact />
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-8 text-center">
              <Link href="/gallery" className="btn btn-primary">
                {t("diary.cta")}
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      {/* 7. Contact CTA */}
      <section
        aria-labelledby="cta-title"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20"
      >
        <Reveal>
          <DimensionDivider id="cta-title" title={t("contactCta.title")} />
          <p className="mx-auto mt-8 max-w-xl text-center font-heading text-2xl font-semibold sm:text-3xl">
            {t("contactCta.text")}
          </p>
          <p className="mt-8 text-center">
            <Link href="/contact" className="btn btn-primary">
              {t("home.getInTouch")}
            </Link>
          </p>
        </Reveal>
      </section>
    </>
  );
}
