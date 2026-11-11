// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import hi from "../../messages/hi.json";
import Lightbox from "@/components/Lightbox";
import {
  categoryLabel,
  formatDiaryDate,
  groupByYear,
  localized,
} from "@/lib/diary";
import { ALBUM_CATEGORIES, CATEGORY_LABELS } from "@/lib/supabase/types";
import type { GalleryImage } from "@/lib/supabase/types";

afterEach(cleanup);

describe("groupByYear", () => {
  it("groups newest year first, preserves order and puts undated last", () => {
    const items = [
      { id: "a", event_date: "2023-05-01" },
      { id: "b", event_date: null },
      { id: "c", event_date: "2024-03-12" },
      { id: "d", event_date: "2023-01-09" },
      { id: "e", event_date: "2024-01-02" },
    ];
    const groups = groupByYear(items);
    expect(groups.map((g) => g.year)).toEqual([2024, 2023, null]);
    expect(groups[0].items.map((i) => i.id)).toEqual(["c", "e"]);
    expect(groups[1].items.map((i) => i.id)).toEqual(["a", "d"]);
    expect(groups[2].items.map((i) => i.id)).toEqual(["b"]);
  });

  it("returns no groups for an empty list", () => {
    expect(groupByYear([])).toEqual([]);
  });
});

describe("categoryLabel", () => {
  it("returns the label for each locale", () => {
    expect(categoryLabel("disaster_relief", "en")).toBe("Disaster Relief");
    expect(categoryLabel("disaster_relief", "hi")).toBe("आपदा राहत");
    expect(categoryLabel("awards", "en")).toBe("Awards & Honours");
  });

  it("has an English and Hindi label for every category", () => {
    for (const c of ALBUM_CATEGORIES) {
      expect(CATEGORY_LABELS[c].en).toBeTruthy();
      expect(CATEGORY_LABELS[c].hi).toMatch(/[ऀ-ॿ]/);
    }
  });

  it("falls back to Other for an unknown category", () => {
    expect(categoryLabel("nonsense", "en")).toBe("Other");
  });
});

describe("formatDiaryDate", () => {
  it("formats as a survey-tag date in English", () => {
    expect(formatDiaryDate("2024-03-12", "en")).toBe("12 MAR 2024");
    expect(formatDiaryDate("2021-12-01", "en")).toBe("01 DEC 2021");
  });

  it("formats in Hindi", () => {
    const s = formatDiaryDate("2024-03-12", "hi");
    expect(s).toContain("मार्च");
    expect(s).toContain("12");
    expect(s).toContain("2024");
  });
});

describe("localized", () => {
  it("uses Hindi when present", () => {
    expect(localized("Bridge", "पुल", "hi")).toBe("पुल");
  });
  it("falls back to English when Hindi is empty or blank", () => {
    expect(localized("Bridge", "", "hi")).toBe("Bridge");
    expect(localized("Bridge", "  ", "hi")).toBe("Bridge");
    expect(localized("Bridge", null, "hi")).toBe("Bridge");
  });
  it("uses English for en", () => {
    expect(localized("Bridge", "पुल", "en")).toBe("Bridge");
    expect(localized(null, null, "en")).toBe("");
  });
});

const images: GalleryImage[] = [0, 1, 2].map((i) => ({
  id: `img-${i}`,
  album_id: "alb",
  storage_path: `a/${i}.jpg`,
  width: 800,
  height: 600,
  blur_data_url: null,
  caption_en: `Caption ${i + 1}`,
  caption_hi: i === 1 ? "शीर्षक 2" : null,
  tags: [],
  taken_on: null,
  sort_order: i,
  created_at: "2024-01-01T00:00:00Z",
  url: `https://example.supabase.co/storage/v1/object/public/gallery/a/${i}.jpg`,
}));

function setup(locale: "en" | "hi" = "en", index = 0) {
  const onClose = vi.fn();
  const onIndexChange = vi.fn();
  render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? en : hi}>
      <Lightbox
        images={images}
        index={index}
        albumTitle="Album"
        onClose={onClose}
        onIndexChange={onIndexChange}
      />
    </NextIntlClientProvider>,
  );
  return { onClose, onIndexChange };
}

describe("Lightbox", () => {
  it("is a modal dialog showing the counter and caption", () => {
    setup();
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(screen.getByText("1 / 3")).toBeTruthy();
    expect(screen.getByText("Caption 1")).toBeTruthy();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("ArrowRight advances and ArrowLeft goes back (wrapping)", () => {
    const { onIndexChange } = setup("en", 0);
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
  });

  it("Escape closes", () => {
    const { onClose } = setup();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("swipe left goes forward, swipe right goes back", () => {
    const { onIndexChange } = setup("en", 1);
    const dialog = screen.getByRole("dialog");
    fireEvent.touchStart(dialog, { touches: [{ clientX: 300 }] });
    fireEvent.touchEnd(dialog, { changedTouches: [{ clientX: 100 }] });
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
    fireEvent.touchStart(dialog, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(dialog, { changedTouches: [{ clientX: 300 }] });
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
  });

  it("uses the Hindi caption with English fallback", () => {
    setup("hi", 1);
    expect(screen.getByText("शीर्षक 2")).toBeTruthy();
    cleanup();
    setup("hi", 0);
    expect(screen.getByText("Caption 1")).toBeTruthy();
  });

  it("restores body scroll on unmount", () => {
    setup();
    cleanup();
    expect(document.body.style.overflow).toBe("");
  });
});
