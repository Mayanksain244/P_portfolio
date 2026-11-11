import type { Localized } from "./profile";

export type WorkType = "road" | "bridge" | "building" | "protection" | "other";
export type WorkStatus = "completed" | "ongoing";

export type Work = {
  slug: string;
  title: Localized;
  location: Localized;
  district: Localized;
  year: number;
  type: WorkType;
  status: WorkStatus;
  summary: Localized;
  details?: Localized;
  scope?: { label: Localized; value: string }[];
  /** Path under /public. */
  image?: string;
  featured?: boolean;
};

export const WORK_TYPES: WorkType[] = [
  "road",
  "bridge",
  "building",
  "protection",
  "other",
];
export const WORK_STATUSES: WorkStatus[] = ["completed", "ongoing"];

/** Real projects are pending from the owner. Never add invented entries here. */
export const works: Work[] = [];
