import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type Json = { [key: string]: string | Json };

function load(locale: string): Json {
  const file = path.resolve(__dirname, "../../messages", `${locale}.json`);
  return JSON.parse(readFileSync(file, "utf8"));
}

/** Flattens nested objects into sorted dot-path keys, e.g. "nav.home". */
function keyPaths(obj: Json, prefix = ""): string[] {
  return Object.entries(obj)
    .flatMap(([key, value]) =>
      typeof value === "object" && value !== null
        ? keyPaths(value, `${prefix}${key}.`)
        : [`${prefix}${key}`],
    )
    .sort();
}

function leaves(obj: Json): string[] {
  return Object.values(obj).flatMap((v) =>
    typeof v === "string" ? [v] : leaves(v),
  );
}

describe("messages", () => {
  const en = load("en");
  const hi = load("hi");

  it("en and hi have identical key sets", () => {
    expect(keyPaths(hi)).toEqual(keyPaths(en));
  });

  it("has no empty strings", () => {
    for (const msgs of [en, hi]) {
      expect(leaves(msgs).filter((s) => s.trim() === "")).toEqual([]);
    }
  });

  it("Hindi nav labels use Devanagari", () => {
    const nav = hi.nav as Json;
    for (const key of ["home", "works", "gallery", "contact"]) {
      expect(nav[key]).toMatch(/[ऀ-ॿ]/);
    }
  });
});
