import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ALL_ITEMS, DEFAULT_PAGE, findItem, NAVIGATION } from "./navigation";

/** The GovData (DCAT-AP.de) categories, as slugs. Same list as CATEGORIES in scripts/manifest.py's `category`. */
const GOVDATA_CATEGORIES = [
  "population-society",
  "education-culture-sport",
  "health",
  "justice-safety",
  "economy-finance",
  "energy",
  "environment",
  "transport",
  "agriculture-food",
  "science-technology",
  "government-public-sector",
  "regions-cities",
];

const SOURCES_JSON = path.resolve(__dirname, "../../data/sources.json");

describe("navigation", () => {
  it("has the sections Explore, Decide, Themes and a footer, in that order", () => {
    expect(NAVIGATION.map((s) => s.id)).toEqual(["explore", "decide", "themes", "footer"]);
  });

  it("lists the twelve GovData categories as themes", () => {
    const themes = NAVIGATION.find((s) => s.id === "themes")!.items.map((i) => i.id);
    expect(themes).toEqual(GOVDATA_CATEGORIES);
  });

  it("uses unique ids that are safe in a URL hash", () => {
    const ids = ALL_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });

  it("describes every page and says what it will show", () => {
    for (const item of ALL_ITEMS) {
      expect(item.label.trim(), item.id).not.toBe("");
      expect(item.description.trim(), item.id).not.toBe("");
      expect(item.planned.length, item.id).toBeGreaterThan(0);
    }
  });

  it("gives every page except the Overview a key figure for its Overview card", () => {
    for (const item of ALL_ITEMS.filter((i) => i.id !== DEFAULT_PAGE)) {
      expect(item.keyFigure?.trim(), item.id).toBeTruthy();
    }
  });

  it("feeds every theme from at least one dataset", () => {
    for (const item of NAVIGATION.find((s) => s.id === "themes")!.items) {
      expect(item.sources.length, item.id).toBeGreaterThan(0);
    }
  });

  it("has a default page that exists", () => {
    expect(findItem(DEFAULT_PAGE)).toBeDefined();
    expect(findItem("nope")).toBeUndefined();
  });

  // data/sources.json is generated from the downloaded files; on a fresh checkout it may be absent.
  it.skipIf(!fs.existsSync(SOURCES_JSON))("only names datasets that exist in data/sources.json", () => {
    const manifest = JSON.parse(fs.readFileSync(SOURCES_JSON, "utf8")) as { datasets: { id: string }[] };
    const known = new Set(manifest.datasets.map((d) => d.id));
    for (const item of ALL_ITEMS) {
      for (const source of item.sources) expect(known, `${item.id} → ${source}`).toContain(source);
    }
  });
});
