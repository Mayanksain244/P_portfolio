"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { profile } from "@/content/profile";
import { Link, usePathname } from "@/i18n/navigation";
import { pick } from "@/lib/content";
import LanguageToggle from "./LanguageToggle";
import Monogram from "./Monogram";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { href: "/", key: "home" },
  { href: "/works", key: "works" },
  { href: "/gallery", key: "gallery" },
  { href: "/contact", key: "contact" },
] as const;

export default function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus trap + Escape for the mobile panel
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const button = buttonRef.current;
    if (!panel || !button) return;

    const getFocusables = () => [
      button,
      ...Array.from(panel.querySelectorAll<HTMLElement>("a[href], button")),
    ];
    getFocusables()[1]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const els = getFocusables();
      const first = els[0];
      const last = els[els.length - 1];
      const activeEl = document.activeElement;
      if (e.shiftKey && activeEl === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const linkClass = (href: string) =>
    `inline-block py-2 text-[15px] font-medium transition-colors hover:text-link ${
      isActive(href)
        ? "underline decoration-marigold decoration-[3px] underline-offset-[10px]"
        : ""
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 text-foreground">
          <Monogram className="h-9 w-9 shrink-0" />
          <span className="min-w-0">
            <span className="block truncate font-heading text-lg font-semibold leading-tight">
              {pick(profile.name, locale)}
            </span>
            <span className="block truncate text-[11px] leading-tight text-muted">
              {pick(profile.designationShort, locale)}
            </span>
          </span>
        </Link>

        <nav aria-label={t("nav.label")} className="hidden md:block">
          <ul className="flex items-center gap-7">
            {NAV.map(({ href, key }) => (
              <li key={key}>
                <Link
                  href={href}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={linkClass(href)}
                >
                  {t(`nav.${key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <LanguageToggle />
          <ThemeToggle className="hidden md:inline-flex" />
          <button
            ref={buttonRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-11 w-11 items-center justify-center text-foreground md:hidden"
          >
            <svg
              aria-hidden="true"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {open ? (
                <path d="M5 5 L19 19 M19 5 L5 19" />
              ) : (
                <path d="M4 7 H20 M4 12 H20 M4 17 H20" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-nav"
          ref={panelRef}
          className="absolute inset-x-0 top-full border-b border-rule bg-background shadow-lg md:hidden"
        >
          <nav aria-label={t("nav.label")} className="px-4 py-3">
            <ul className="flex flex-col">
              {NAV.map(({ href, key }) => (
                <li key={key} className="border-b border-rule last:border-0">
                  <Link
                    href={href}
                    aria-current={isActive(href) ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`block py-3 text-base font-medium ${
                      isActive(href)
                        ? "underline decoration-marigold decoration-[3px] underline-offset-8"
                        : ""
                    }`}
                  >
                    {t(`nav.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex justify-end border-t border-rule px-4 py-2">
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
