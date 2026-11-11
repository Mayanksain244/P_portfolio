import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import BlueprintGrid from "@/components/BlueprintGrid";
import DimensionDivider from "@/components/DimensionDivider";
import { StatusStamp } from "@/components/WorkCard";
import WorkTypeIcon from "@/components/WorkTypeIcon";
import { works } from "@/content/works";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { pick } from "@/lib/content";
import { projectNo } from "@/lib/works";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    works.map((w) => ({ locale, slug: w.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const work = works.find((w) => w.slug === slug);
  if (!work) return {};
  return {
    title: pick(work.title, locale),
    description: pick(work.summary, locale),
  };
}

const TH =
  "w-[36%] border-r border-navy/40 px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-muted dark:border-paper/40";
const ROW = "border-b border-navy/40 last:border-b-0 dark:border-paper/40";

export default async function WorkDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const work = works.find((w) => w.slug === slug);
  if (!work) notFound();

  const [t, tc] = await Promise.all([
    getTranslations("works"),
    getTranslations("workCard"),
  ]);
  const index = works.indexOf(work) + 1;

  const rows: [string, React.ReactNode][] = [
    [tc("projectNo"), <span key="n" className="font-mono text-sm">{projectNo(work.year, index)}</span>],
    [tc("location"), `${pick(work.location, locale)}, ${pick(work.district, locale)}`],
    [tc("year"), String(work.year)],
    [t("typeGroup"), t(`type.${work.type}`)],
    [tc("status"), <StatusStamp key="s" status={work.status} />],
    ...(work.scope ?? []).map(
      (s): [string, React.ReactNode] => [pick(s.label, locale), s.value],
    ),
  ];

  return (
    <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/works"
        className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-link hover:underline"
      >
        <span aria-hidden="true">←</span>
        {t("back")}
      </Link>

      <h1 className="mt-4 font-heading text-4xl font-semibold sm:text-5xl">
        {pick(work.title, locale)}
      </h1>

      <div className="relative mt-8 aspect-[16/9] border-2 border-navy dark:border-paper">
        {work.image ? (
          <Image
            src={work.image}
            alt={t("hero")}
            fill
            priority
            sizes="(min-width: 1152px) 1152px, 100vw"
            className="object-cover"
          />
        ) : (
          <BlueprintGrid className="flex h-full w-full flex-col items-center justify-center gap-3 bg-surface/50 text-navy dark:text-paper">
            <WorkTypeIcon type={work.type} className="h-20 w-20 opacity-80" />
            <span className="dim-title text-xs font-semibold text-muted">
              {t("noImage")}
            </span>
          </BlueprintGrid>
        )}
      </div>

      <div className="mt-12 grid items-start gap-12 lg:grid-cols-[2fr_1fr]">
        <div className="max-w-prose">
          <DimensionDivider title={t("summary")} as="h2" />
          <p className="mt-6 text-lg leading-8">{pick(work.summary, locale)}</p>
          {work.details && (
            <>
              <DimensionDivider title={t("details")} as="h2" className="mt-12" />
              <p className="mt-6 text-lg leading-8">{pick(work.details, locale)}</p>
            </>
          )}
        </div>

        <table className="w-full border-2 border-navy text-sm dark:border-paper">
          <caption className="border-b-2 border-navy bg-navy px-4 py-2 text-start text-xs font-semibold uppercase tracking-wider text-paper dark:border-paper dark:bg-navy-900">
            {t("specs")}
          </caption>
          <tbody>
            {rows.map(([k, v], i) => (
              <tr key={i} className={ROW}>
                <th scope="row" className={TH}>
                  {k}
                </th>
                <td className="px-4 py-3">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
