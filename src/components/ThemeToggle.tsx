"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

const BTN =
  "relative inline-flex h-10 w-10 shrink-0 items-center justify-center text-foreground";

/** 40px sun/moon button. Renders a same-size placeholder until mounted. */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const t = useTranslations("theme");
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return <span aria-hidden="true" className={`${BTN} ${className}`} />;
  }

  const dark = resolvedTheme === "dark";
  const icon =
    "absolute transition-[transform,opacity] duration-300 motion-reduce:transition-none";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? t("switchToLight") : t("switchToDark")}
      className={`${BTN} hover:text-link ${className}`}
    >
      {/* Sun: shown in dark mode */}
      <svg
        aria-hidden="true"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className={`${icon} ${dark ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"}`}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      {/* Moon: shown in light mode */}
      <svg
        aria-hidden="true"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${icon} ${dark ? "rotate-90 opacity-0" : "rotate-0 opacity-100"}`}
      >
        <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" />
      </svg>
    </button>
  );
}
