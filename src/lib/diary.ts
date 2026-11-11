import { CATEGORY_LABELS, type AlbumCategory } from "@/lib/supabase/types";

/** Paths Phase 4 admin actions should pass to revalidatePath. */
export const GALLERY_PATHS = {
  index: (locale: string) => `/${locale}/gallery`,
  album: (locale: string, slug: string) => `/${locale}/gallery/${slug}`,
  home: (locale: string) => `/${locale}`,
};

export function categoryLabel(category: string, locale: string): string {
  const entry = CATEGORY_LABELS[category as AlbumCategory] ?? CATEGORY_LABELS.other;
  return locale === "hi" ? entry.hi : entry.en;
}

/** Locale text with fallback to English when the Hindi value is empty. */
export function localized(
  en: string | null | undefined,
  hi: string | null | undefined,
  locale: string,
): string {
  if (locale === "hi") {
    const h = hi?.trim();
    if (h) return h;
  }
  return en?.trim() ?? "";
}

const EN_MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** "12 MAR 2024" in en, "12 मार्च 2024" in hi. Input is a YYYY-MM-DD date. */
export function formatDiaryDate(date: string, locale: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!m) return date;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (locale === "hi") {
    return new Intl.DateTimeFormat("hi-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(y, mo - 1, d)));
  }
  return `${String(d).padStart(2, "0")} ${EN_MONTHS[mo - 1]} ${y}`;
}

export type YearGroup<T> = { year: number | null; items: T[] };

/** Groups by year of event_date (newest year first); undated items go last. Item order is preserved. */
export function groupByYear<T extends { event_date: string | null }>(
  items: T[],
): YearGroup<T>[] {
  const byYear = new Map<number, T[]>();
  const undated: T[] = [];
  for (const item of items) {
    const y = item.event_date ? Number(item.event_date.slice(0, 4)) : NaN;
    if (Number.isNaN(y)) {
      undated.push(item);
      continue;
    }
    byYear.set(y, [...(byYear.get(y) ?? []), item]);
  }
  const groups: YearGroup<T>[] = [...byYear.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, list]) => ({ year, items: list }));
  if (undated.length) groups.push({ year: null, items: undated });
  return groups;
}
