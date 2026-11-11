import { useLocale, useTranslations } from "next-intl";
import { profile } from "@/content/profile";
import { pick } from "@/lib/content";
import CurrentYear from "./CurrentYear";
import { Link } from "@/i18n/navigation";
import ContourBackground from "./ContourBackground";
import SocialLinks from "./SocialLinks";

const LINKS = [
  { href: "/", key: "home" },
  { href: "/works", key: "works" },
  { href: "/gallery", key: "gallery" },
  { href: "/contact", key: "contact" },
] as const;

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const hasSocial = profile.social.length > 0;

  return (
    <footer className="relative overflow-hidden border-t border-rule bg-navy text-paper dark:bg-navy-900">
      <ContourBackground className="text-paper opacity-[0.08]" />
      <div className={`relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 ${hasSocial ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
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

        {hasSocial && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-marigold">
              {t("footer.social")}
            </h2>
            <SocialLinks links={profile.social} tone="dark" className="mt-3" />
          </div>
        )}
      </div>

      <div className="relative border-t border-paper/15">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-paper/75 sm:px-6">
          &copy; <CurrentYear /> {pick(profile.name, locale)}. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
