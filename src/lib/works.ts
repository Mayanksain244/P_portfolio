import type { Work, WorkStatus, WorkType } from "@/content/works";

export type WorkFilters = {
  types: WorkType[];
  statuses: WorkStatus[];
};

/** Empty selection in a group means "all" for that group. */
export function filterWorks<T extends Pick<Work, "type" | "status">>(
  list: T[],
  filters: WorkFilters,
): T[] {
  return list.filter(
    (w) =>
      (filters.types.length === 0 || filters.types.includes(w.type)) &&
      (filters.statuses.length === 0 || filters.statuses.includes(w.status)),
  );
}

export function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Drawing-register style number, e.g. PWD-UK/2023/03. `index` is 1-based. */
export function projectNo(year: number, index: number): string {
  return `PWD-UK/${year}/${String(index).padStart(2, "0")}`;
}
