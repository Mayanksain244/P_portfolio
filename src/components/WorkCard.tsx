import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { Work } from "@/content/works";
import { Link } from "@/i18n/navigation";
import { pick } from "@/lib/content";
import { projectNo } from "@/lib/works";
import BlueprintGrid from "./BlueprintGrid";
import WorkTypeIcon from "./WorkTypeIcon";

export function StatusStamp({ status }: { status: Work["status"] }) {
  const t = useTranslations("works.stamp");
  // Pine for completed, marigold for ongoing; darkened / lightened per theme to keep contrast.
  const tone =
    status === "completed"
      ? "text-pine dark:text-[#8fc9b2]"
      : "text-[#7a5200] dark:text-marigold";
  return (
    <span
      data-status={status}
      className={`inline-block -rotate-6 border-4 border-double border-current px-2.5 py-0.5 text-sm font-bold uppercase tracking-[0.14em] ${tone}`}
    >
      {t(status)}
    </span>
  );
}

const TH =
  "w-[34%] border-r border-navy/40 px-3 py-2 text-start text-xs font-semibold uppercase tracking-wide text-muted dark:border-paper/40";
const ROW = "border-b border-navy/40 dark:border-paper/40";

/** Project card styled as an engineering drawing title-block. `index` is 1-based. */
export default function WorkCard({
  work,
  index,
}: {
  work: Work;
  index: number;
}) {
  const t = useTranslations("workCard");
  const locale = useLocale();
  const title = pick(work.title, locale);

  return (
    <article className="relative flex w-full flex-col border-2 border-navy bg-background text-foreground transition-shadow focus-within:shadow-lg hover:shadow-lg dark:border-paper">
      <div className="relative aspect-[16/10] border-b-2 border-navy dark:border-paper">
        {work.image ? (
          <Image
            src={work.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <BlueprintGrid className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface/50 text-navy dark:text-paper">
            <WorkTypeIcon type={work.type} className="h-14 w-14 opacity-80" />
            <span className="dim-title text-xs font-semibold text-muted">
              {t("noImage")}
            </span>
          </BlueprintGrid>
        )}
      </div>

      <table className="w-full border-collapse text-sm">
        <tbody>
          <tr className={ROW}>
            <th scope="row" className={TH}>
              {t("projectNo")}
            </th>
            <td className="px-3 py-2 font-mono text-xs">
              {projectNo(work.year, index)}
            </td>
          </tr>
          <tr className={ROW}>
            <th scope="row" className={TH}>
              {t("titleRow")}
            </th>
            <td className="px-3 py-2 font-heading text-base font-semibold">
              <Link
                href={`/works/${work.slug}`}
                className="after:absolute after:inset-0 hover:underline"
              >
                {title}
              </Link>
            </td>
          </tr>
          <tr className={ROW}>
            <th scope="row" className={TH}>
              {t("location")}
            </th>
            <td className="px-3 py-2">
              {pick(work.location, locale)}, {pick(work.district, locale)}
            </td>
          </tr>
          <tr className={ROW}>
            <th scope="row" className={TH}>
              {t("year")}
            </th>
            <td className="px-3 py-2">{work.year}</td>
          </tr>
          <tr>
            <th scope="row" className={TH}>
              {t("status")}
            </th>
            <td className="px-3 py-3">
              <StatusStamp status={work.status} />
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}
