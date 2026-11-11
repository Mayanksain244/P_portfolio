// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import hi from "../../messages/hi.json";
import DataSheet from "@/components/DataSheet";
import ServiceJourney from "@/components/ServiceJourney";
import WorkCard from "@/components/WorkCard";
import WorksBrowser from "@/components/WorksBrowser";
import { fixtureWorks } from "./fixtures/works";

afterEach(cleanup);

function wrap(ui: ReactNode, locale: "en" | "hi" = "en") {
  return (
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : hi}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("WorkCard", () => {
  it("renders the title-block rows and status stamp", () => {
    render(wrap(<WorkCard work={fixtureWorks[0]} index={1} />));
    expect(screen.getByText("PWD-UK/2020/01")).toBeTruthy();
    expect(screen.getByText("SAMPLE ROAD (test fixture)")).toBeTruthy();
    expect(screen.getByText("Sample Town, Sample District")).toBeTruthy();
    expect(screen.getByText("2020")).toBeTruthy();
    expect(screen.getByText("COMPLETED")).toBeTruthy();
    expect(screen.getByRole("link").getAttribute("href")).toContain("/works/sample-road");
  });

  it("shows the ongoing stamp and a placeholder when there is no image", () => {
    const { container } = render(wrap(<WorkCard work={fixtureWorks[1]} index={2} />));
    expect(screen.getByText("ONGOING")).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("renders Hindi content", () => {
    render(wrap(<WorkCard work={fixtureWorks[0]} index={1} />, "hi"));
    expect(screen.getByText("नमूना सड़क (परीक्षण)")).toBeTruthy();
    expect(screen.getByText("संपन्न")).toBeTruthy();
  });
});

describe("WorksBrowser", () => {
  it("shows the empty register panel when there are no works", () => {
    render(wrap(<WorksBrowser works={[]} />));
    expect(
      screen.getByText(
        "The project register is being compiled. Selected works will appear here soon.",
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("link").getAttribute("href")).toContain("#journey");
  });

  it("filters with accessible toggle chips", () => {
    render(wrap(<WorksBrowser works={fixtureWorks} />));
    expect(screen.getAllByRole("article")).toHaveLength(2);

    const bridge = screen.getByRole("button", { name: "Bridge" });
    expect(bridge.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(bridge);
    expect(bridge.getAttribute("aria-pressed")).toBe("true");
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(1);
    expect(within(cards[0]).getByText("SAMPLE BRIDGE (test fixture)")).toBeTruthy();
    // The project number is stable: it is the position in the full register.
    expect(within(cards[0]).getByText("PWD-UK/2024/02")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Completed" }));
    expect(screen.queryAllByRole("article")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });
});

describe("ServiceJourney", () => {
  it("renders an ordered list of postings and a computed total", () => {
    render(wrap(<ServiceJourney years={22} />));
    const list = screen.getByRole("list", { name: "Postings in chronological order" });
    expect(list.tagName).toBe("OL");
    expect(within(list).getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByText("Current posting")).toBeTruthy();
    expect(screen.getByText("5 postings · 3 districts · 22+ years")).toBeTruthy();
    expect(screen.getAllByRole("img")[0].getAttribute("aria-label")).toContain(
      "Ghansali → Roorkee",
    );
  });

  it("highlights the pin label when a timeline stop is focused", () => {
    render(wrap(<ServiceJourney years={22} />));
    const stop = screen.getByRole("button", { name: /Roorkee/ });
    fireEvent.focus(stop);
    const label = screen.getAllByText("Roorkee").find((el) => el.tagName === "LI");
    expect(label?.className).toContain("ring-1");
    fireEvent.blur(stop);
    expect(label?.className).not.toContain("ring-1");
  });
});

describe("ThemeToggle", () => {
  it("renders a labelled button that switches theme", async () => {
    const { ThemeProvider } = await import("next-themes");
    const ThemeToggle = (await import("@/components/ThemeToggle")).default;
    window.matchMedia ??= ((q: string) => ({
      matches: false,
      media: q,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    })) as unknown as typeof window.matchMedia;
    render(
      wrap(
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem>
          <ThemeToggle />
        </ThemeProvider>,
      ),
    );
    const btn = await screen.findByRole("button", { name: "Switch to dark theme" });
    fireEvent.click(btn);
    expect(
      await screen.findByRole("button", { name: "Switch to light theme" }),
    ).toBeTruthy();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});

describe("DataSheet", () => {
  it.each([
    ["en", en, "Dugadda, Pauri Garhwal", "Name", "SHEET 01"],
    ["hi", hi, "दुगड्डा, पौड़ी गढ़वाल", "नाम", "पत्रक 01"],
  ] as const)("renders the title-block rows (%s)", (locale, msgs, posting, label, header) => {
    render(wrap(<DataSheet />, locale));
    expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByText(posting)).toBeTruthy();
    expect(screen.getByText("2004")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText(msgs.about.departmentValue)).toBeTruthy();
    expect(screen.getByText(new RegExp(header, "i"))).toBeTruthy();
    expect(screen.getAllByRole("row")).toHaveLength(6);
  });
});
