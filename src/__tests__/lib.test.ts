import { describe, expect, it } from "vitest";
import { profile } from "@/content/profile";
import { works } from "@/content/works";
import { buildArc, buildRoute } from "@/lib/journey";
import { districtCount, yearsOfService } from "@/lib/stats";
import { filterWorks, projectNo, toggle } from "@/lib/works";
import { fixtureWorks } from "./fixtures/works";

describe("profile stats", () => {
  it("computes years of service from the start year", () => {
    expect(yearsOfService(2004, new Date("2026-11-11"))).toBe(22);
    expect(yearsOfService(2004, new Date("2030-01-01"))).toBe(26);
  });
  it("has 5 postings across 3 unique districts", () => {
    expect(profile.postings).toHaveLength(5);
    expect(districtCount(profile.postings)).toBe(3);
  });
  it("is chronological with one current posting", () => {
    const froms = profile.postings.map((p) => p.from);
    expect(froms).toEqual([...froms].sort((a, b) => a - b));
    expect(profile.postings.filter((p) => p.to === null)).toHaveLength(1);
  });
  it("uses the AAE designation", () => {
    expect(profile.designation.en).toMatch(/Additional Assistant Engineer \(AAE\)/);
    expect(profile.bio.en).toMatch(/Additional Assistant Engineer \(AAE\)/);
    expect(profile.bio.hi).toContain("अपर सहायक अभियंता");
  });
});

describe("real works register", () => {
  it("is empty until the owner supplies projects", () => {
    expect(works).toEqual([]);
  });
});

describe("journey arcs", () => {
  const a = { x: 0, y: 0 };
  const b = { x: 100, y: 0 };
  it("bows to opposite sides for opposite signs", () => {
    expect(buildArc(a, b, 1).control.y).toBeGreaterThan(0);
    expect(buildArc(a, b, -1).control.y).toBeLessThan(0);
  });
  it("points the midpoint chevron along the direction of travel", () => {
    expect(buildArc(a, b, 1).angle).toBeCloseTo(0);
    expect(Math.abs(buildArc(b, a, 1).angle)).toBeCloseTo(180);
  });
  it("builds n-1 arcs", () => {
    const arcs = buildRoute([a, b, { x: 200, y: 50 }, { x: 300, y: 0 }]);
    expect(arcs).toHaveLength(3);
  });
});

describe("works filtering", () => {
  it("returns everything with no filters", () => {
    expect(filterWorks(fixtureWorks, { types: [], statuses: [] })).toHaveLength(2);
  });
  it("filters by type", () => {
    const r = filterWorks(fixtureWorks, { types: ["bridge"], statuses: [] });
    expect(r.map((w) => w.slug)).toEqual(["sample-bridge"]);
  });
  it("combines groups with AND, values within a group with OR", () => {
    expect(
      filterWorks(fixtureWorks, { types: ["road", "bridge"], statuses: ["ongoing"] }),
    ).toHaveLength(1);
    expect(
      filterWorks(fixtureWorks, { types: ["road"], statuses: ["ongoing"] }),
    ).toHaveLength(0);
  });
  it("toggle adds and removes", () => {
    expect(toggle(["a"], "b")).toEqual(["a", "b"]);
    expect(toggle(["a", "b"], "a")).toEqual(["b"]);
  });
  it("formats the project number", () => {
    expect(projectNo(2023, 3)).toBe("PWD-UK/2023/03");
  });
});
