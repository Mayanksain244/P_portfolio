"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export default function LanguageToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("language");

  const base = "px-1.5 py-2 text-sm transition-colors hover:text-link";
  const active =
    "font-bold underline decoration-marigold decoration-2 underline-offset-4";

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="flex items-center text-foreground"
    >
      <Link
        href={pathname}
        locale="en"
        lang="en"
        hrefLang="en"
        aria-label={t("switchToEnglish")}
        aria-current={locale === "en" ? "true" : undefined}
        className={`${base} ${locale === "en" ? active : ""}`}
      >
        EN
      </Link>
      <span aria-hidden="true" className="text-muted">
        |
      </span>
      <Link
        href={pathname}
        locale="hi"
        lang="hi"
        hrefLang="hi"
        aria-label={t("switchToHindi")}
        aria-current={locale === "hi" ? "true" : undefined}
        className={`${base} ${locale === "hi" ? active : ""}`}
      >
        हिं
      </Link>
    </div>
  );
}
