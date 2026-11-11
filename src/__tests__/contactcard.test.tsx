// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import hi from "../../messages/hi.json";
import ContactCard from "@/components/ContactCard";
import { profile } from "@/content/profile";

afterEach(cleanup);

const wrap = (locale: "en" | "hi") => (
  <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : hi}>
    <ContactCard />
  </NextIntlClientProvider>
);

describe("ContactCard office", () => {
  it.each(["en", "hi"] as const)("shows the office address and Google link (%s)", (locale) => {
    const { container } = render(wrap(locale));
    const office = profile.office!;
    const address = container.querySelector("address")!;
    expect(address.textContent).toContain(office.address[locale]);
    expect(address.textContent).toContain(office.name[locale]);

    const link = container.querySelector('a[href^="https://maps.google.com"]')!;
    expect(link.getAttribute("href")).toBe("https://maps.google.com/?cid=9673569232844427924");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");

    const frame = container.querySelector("iframe")!;
    expect(frame.getAttribute("src")).toContain("marker=29.8062414,78.6123615");
    expect(frame.getAttribute("title")).toContain(locale === "en" ? "PWD Office" : "कार्यालय");
  });

  it("keeps the posting coordinates for the journey map", () => {
    const d = profile.postings.find((p) => p.to === null)!;
    expect([d.lat, d.lng]).toEqual([29.805, 78.612]);
  });
});
