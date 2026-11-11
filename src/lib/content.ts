import type { Localized } from "@/content/profile";

/** Picks the string for a locale, falling back to English. */
export function pick(value: Localized, locale: string): string {
  return locale === "hi" ? value.hi : value.en;
}
