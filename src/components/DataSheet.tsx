import { useLocale, useTranslations } from "next-intl";
import { profile } from "@/content/profile";
import { pick } from "@/lib/content";
import Monogram from "./Monogram";

const TH =
  "w-[36%] border-r border-navy/40 px-3 py-2.5 text-start align-top text-xs font-semibold uppercase tracking-wide text-muted dark:border-paper/40";
const ROW = "border-b border-navy/40 dark:border-paper/40";

/** "Personal data sheet": an engineering-drawing title block (matches WorkCard). */
export default function DataSheet() {
  const t = useTranslations("about");
  const locale = useLocale();
  const current = profile.postings.find((p) => p.to === null);

  const rows: [string, string][] = [
    [t("name"), pick(profile.name, locale)],
    [t("designation"), pick(profile.designation, locale)],
    [t("department"), t("departmentValue")],
    [t("since"), String(profile.serviceStartYear)],
    [
      t("currentPosting"),
      current
        ? `${pick(current.place, locale)}, ${pick(current.district, locale)}`
        : "—",
    ],
    [t("postings"), String(profile.postings.length)],
  ];

  return (
    <figure className="m-0 border-2 border-navy bg-background text-foreground dark:border-paper">
      <div className="flex items-center gap-3 border-b-2 border-navy bg-navy px-3 py-2 text-paper dark:border-paper dark:bg-navy-900">
        <Monogram className="h-7 w-7 shrink-0" />
        <span className="dim-title text-xs font-semibold tracking-[0.14em] sm:text-sm">
          {t("sheetHeader")}
        </span>
      </div>
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{t("sheetTitle")}</caption>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className={ROW}>
              <th scope="row" className={TH}>
                {k}
              </th>
              <td className="px-3 py-2.5">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-muted">
        <span className="dim-title font-semibold tracking-[0.14em]">
          {t("sheetFooter")}
        </span>
        <span className="font-mono text-[0.7rem] opacity-70">
          {t("drawingNo")}
        </span>
      </div>
    </figure>
  );
}
