import { useLocale, useTranslations } from "next-intl";
import { profile } from "@/content/profile";
import { pick } from "@/lib/content";
import CurrentYear from "./CurrentYear";
import { Link } from "@/i18n/navigation";
import ContourBackground from "./ContourBackground";

const LINKS = [
  { href: "/", key: "home" },
  { href: "/works", key: "works" },
  { href: "/gallery", key: "gallery" },
  { href: "/contact", key: "contact" },
] as const;

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <footer className="relative overflow-hidden border-t border-rule bg-navy text-paper dark:bg-navy-900">
      <ContourBackground className="text-paper opacity-[0.08]" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-heading text-xl font-semibold">{pick(profile.name, locale)}</p>
          <p className="mt-2 max-w-xs text-sm text-paper/80">
            {pick(profile.designation, locale)}
          </p>
        </div>

        <nav aria-label={t("footer.quickLinks")}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-marigold">
            {t("footer.quickLinks")}
          </h2>
          <ul className="mt-3 space-y-1">
            {LINKS.map(({ href, key }) => (
              <li key={key}>
                <Link
                  href={href}
                  className="inline-block py-1 text-sm text-paper/90 hover:text-marigold hover:underline"
                >
                  {t(`nav.${key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-marigold">
            {t("footer.social")}
          </h2>
          {/* Placeholder for social icons */}
          <ul className="mt-3 flex gap-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="h-9 w-9 rounded-full border border-dashed border-paper/40"
              />
            ))}
          </ul>
          <p className="mt-3 text-sm text-paper/70">{t("footer.socialSoon")}</p>
        </div>
      </div>

      <div className="relative border-t border-paper/15">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-paper/75 sm:px-6">
          &copy; <CurrentYear /> {pick(profile.name, locale)}. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
