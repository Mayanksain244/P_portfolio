import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (p: string) =>
  import("node:fs").then((fs) => fs.readFileSync(path.join(root, p), "utf8"));

describe("social share banner", () => {
  it("has the OG image route, fonts and assets", () => {
    for (const p of [
      "src/app/api/og/[locale]/route.tsx",
      "public/images/og/og-en.jpg",
      "public/images/og/og-hi.jpg",
      "src/app/fonts/og/fraunces-bold.ttf",
      "src/app/fonts/og/fraunces-regular.ttf",
      "public/images/portrait/portrait-og.png",
      "public/images/og/hi-name.png",
      "public/images/og/hi-designation.png",
      "public/images/og/hi-org.png",
    ])
      expect(existsSync(path.join(root, p)), p).toBe(true);
    expect(
      statSync(path.join(root, "public/images/portrait/portrait-og.png")).size,
    ).toBeLessThan(300 * 1024);
  });

  it("exports JPEGs of at most 200 KB (WhatsApp preview limit)", () => {
    for (const l of ["en", "hi"])
      expect(
        statSync(path.join(root, `public/images/og/og-${l}.jpg`)).size,
      ).toBeLessThanOrEqual(200 * 1024);
  });

  it("renders 1200x630 for every locale and has no file-convention route", async () => {
    const src = await read("src/app/api/og/[locale]/route.tsx");
    expect(src).toContain("width: 1200, height: 630");
    expect(src).toContain("generateStaticParams");
    expect(existsSync(path.join(root, "src/app/[locale]/opengraph-image.tsx"))).toBe(false);
  });

  it("layout uses the JPEG for openGraph and twitter", async () => {
    const src = await read("src/app/[locale]/layout.tsx");
    expect(src).toContain("/images/og/og-${locale}.jpg");
    expect(src).toContain("images: [image]");
    expect(src).toContain("images: [image.url]");
    expect(src).not.toContain("portrait-square");
  });
});
