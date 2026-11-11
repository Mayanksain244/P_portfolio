import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { profile } from "@/content/profile";
import { pick } from "@/lib/content";
import BlueprintGrid from "./BlueprintGrid";

/**
 * Portrait slot styled as a drawing title block. Renders `profile.portrait`
 * with next/image when set; otherwise a labelled placeholder.
 */
export default async function PortraitFrame({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "about" });
  const name = pick(profile.name, locale);

  return (
    <figure className="m-0 border-2 border-navy bg-background dark:border-paper">
      <div className="relative aspect-[4/5] border-b-2 border-navy dark:border-paper">
        {profile.portrait ? (
          <Image
            src={profile.portrait}
            alt={name}
            fill
            sizes="(min-width: 1024px) 320px, 80vw"
            className="object-cover"
          />
        ) : (
          <BlueprintGrid className="flex h-full w-full flex-col items-center justify-center gap-4 bg-surface/50 text-navy dark:text-paper">
            <svg
              aria-hidden="true"
              viewBox="0 0 64 64"
              className="h-24 w-24 opacity-70"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="32" cy="24" r="10" />
              <path d="M12 56c2-12 10-18 20-18s18 6 20 18" />
            </svg>
            <figcaption className="dim-title px-4 text-center text-xs font-semibold text-muted sm:text-sm">
              {t("portraitLabel")}
            </figcaption>
          </BlueprintGrid>
        )}
      </div>
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{t("sheetTitle")}</caption>
        <tbody>
          {[
            [t("tbName"), name],
            [t("tbDesignation"), pick(profile.designationShort, locale)],
            [t("tbSince"), String(profile.serviceStartYear)],
          ].map(([k, v], i, arr) => (
            <tr
              key={k}
              className={
                i < arr.length - 1
                  ? "border-b border-navy/40 dark:border-paper/40"
                  : ""
              }
            >
              <th
                scope="row"
                className="w-[38%] border-r border-navy/40 px-3 py-2 text-start text-xs font-semibold uppercase tracking-wide text-muted dark:border-paper/40"
              >
                {k}
              </th>
              <td className="px-3 py-2">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
