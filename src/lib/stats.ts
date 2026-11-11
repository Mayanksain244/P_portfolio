import type { Posting } from "@/content/profile";

/** Full calendar years since the service start year (computed, never hard-coded). */
export function yearsOfService(startYear: number, now: Date = new Date()): number {
  return Math.max(0, now.getFullYear() - startYear);
}

export function districtCount(postings: Posting[]): number {
  return new Set(postings.map((p) => p.district.en)).size;
}

/** "2004-2011" or "2025-present" pieces; callers localise the word "present". */
export function postingRange(p: Posting): { from: number; to: number | null } {
  return { from: p.from, to: p.to };
}
