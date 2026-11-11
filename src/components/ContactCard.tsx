import { useLocale, useTranslations } from "next-intl";
import { profile } from "@/content/profile";
import { pick } from "@/lib/content";
import Monogram from "./Monogram";
import SocialLinks from "./SocialLinks";

/** Right-hand column of the contact page: posting, map, social links, grievance note. */
export default function ContactCard() {
  const t = useTranslations("contact");
  const ts = useTranslations("social");
  const locale = useLocale();
  const current = profile.postings.find((p) => p.to === null);

  const place = current ? pick(current.place, locale) : "";
  const district = current ? pick(current.district, locale) : "";
  const lat = current?.lat;
  const lng = current?.lng;
  const bbox =
    lat !== undefined && lng !== undefined
      ? [lng - 0.05, lat - 0.028, lng + 0.05, lat + 0.028].map((n) => n.toFixed(4)).join(",")
      : null;

  return (
    <aside
      aria-labelledby="cc-title"
      className="border-2 border-navy bg-white/50 text-foreground dark:border-paper/70 dark:bg-navy-900/60"
    >
      <div className="flex items-center gap-3 border-b-2 border-navy bg-navy px-4 py-2.5 text-paper dark:border-paper/70 dark:bg-navy-900">
        <Monogram className="h-6 w-6 shrink-0" />
        <h2 id="cc-title" className="diary-stamp text-xs sm:text-sm">
          {t("card.title")}
        </h2>
      </div>

      {current && bbox && (
        <>
          <div className="border-b border-rule px-4 py-4 sm:px-6">
            <p className="form-label">{t("card.posting")}</p>
            <p className="mt-1 font-heading text-xl font-semibold">
              {place}, {district}
            </p>
            <p className="text-sm text-muted">
              {pick(profile.designationShort, locale)} · {current.from}–
            </p>
          </div>

          <div className="border-b border-rule px-4 py-4 sm:px-6">
            <iframe
              title={t("card.mapTitle", { place, district })}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-60 w-full border border-navy/40 bg-surface dark:border-paper/40"
            />
            <a
              href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=13/${lat}/${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-link underline underline-offset-4 hover:text-marigold-600 dark:hover:text-marigold"
            >
              {t("card.openMap")}
              <span aria-hidden="true" className="ms-1">↗</span>
              <span className="sr-only"> {ts("newTab")}</span>
            </a>
          </div>
        </>
      )}

      {profile.social.length > 0 && (
        <div className="border-b border-rule px-4 py-4 sm:px-6">
          <p className="form-label">{t("card.social")}</p>
          <SocialLinks links={profile.social} className="mt-2" />
        </div>
      )}

      <div className="bg-surface/40 px-4 py-4 sm:px-6">
        <p className="form-label">{t("card.grievanceTitle")}</p>
        <p className="mt-1 text-sm leading-relaxed">
          {t.rich("card.grievance", {
            helpline: (chunks) => (
              <a
                href="tel:1905"
                className="font-semibold text-link underline underline-offset-4 hover:text-marigold-600 dark:hover:text-marigold"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </div>
    </aside>
  );
}
