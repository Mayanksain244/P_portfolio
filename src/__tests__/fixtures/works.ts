import type { Work } from "@/content/works";

/**
 * FAKE data for component tests only. Never import this from application code;
 * the real project register lives in src/content/works.ts.
 */
export const fixtureWorks: Work[] = [
  {
    slug: "sample-road",
    title: { en: "SAMPLE ROAD (test fixture)", hi: "नमूना सड़क (परीक्षण)" },
    location: { en: "Sample Town", hi: "नमूना नगर" },
    district: { en: "Sample District", hi: "नमूना ज़िला" },
    year: 2020,
    type: "road",
    status: "completed",
    summary: { en: "Fake summary for tests.", hi: "परीक्षण हेतु काल्पनिक सारांश।" },
    scope: [{ label: { en: "Length", hi: "लंबाई" }, value: "0 km (fake)" }],
    featured: true,
  },
  {
    slug: "sample-bridge",
    title: { en: "SAMPLE BRIDGE (test fixture)", hi: "नमूना पुल (परीक्षण)" },
    location: { en: "Sample Village", hi: "नमूना गाँव" },
    district: { en: "Sample District", hi: "नमूना ज़िला" },
    year: 2024,
    type: "bridge",
    status: "ongoing",
    summary: { en: "Fake summary for tests.", hi: "परीक्षण हेतु काल्पनिक सारांश।" },
  },
];
