import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { DEFAULT_DATA_DIR } from "../config/paths.js";
import { parseSemicolonCsv } from "../data/files.js";
import { foldSearch } from "../data/indicators.js";

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "data");
const app = createApp({ dataDir: FIXTURES });

describe("GET /api/regions", () => {
  it("lists Germany, then states, then districts, with 5-digit district keys", async () => {
    const res = await request(app).get("/api/regions");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(8);
    expect(res.body.regions.map((r: { ags: string }) => r.ags)).toEqual(["DE", "09", "11", "12", "09162", "09184", "11000", "12054"]);
  });

  it("leaves out the West/East aggregates", async () => {
    const res = await request(app).get("/api/regions");
    expect(res.body.regions.map((r: { name: string }) => r.name)).not.toContain("West");
  });

  it("links districts to their state and states to Germany", async () => {
    const res = await request(app).get("/api/regions");
    const byAgs = Object.fromEntries(res.body.regions.map((r: { ags: string }) => [r.ags, r]));
    expect(byAgs.DE).toMatchObject({ level: "country", parent: null });
    expect(byAgs["09"]).toMatchObject({ level: "state", parent: "DE", name: "Bayern" });
    expect(byAgs["09162"]).toMatchObject({ level: "district", parent: "09", name: "München, Landeshauptstadt" });
  });

  it("marks East and West, with divided Berlin as neither", async () => {
    const res = await request(app).get("/api/regions");
    const east = Object.fromEntries(res.body.regions.map((r: { ags: string; east: boolean | null }) => [r.ags, r.east]));
    expect(east).toMatchObject({ "09": false, "09162": false, "12": true, "12054": true, "11": null, "11000": null, DE: null });
  });

  it("filters by level and by parent", async () => {
    const states = await request(app).get("/api/regions?level=state");
    expect(states.body.regions.map((r: { ags: string }) => r.ags)).toEqual(["09", "11", "12"]);
    const bavaria = await request(app).get("/api/regions?level=district&parent=09");
    expect(bavaria.body.regions.map((r: { name: string }) => r.name)).toEqual(["München, Landeshauptstadt", "München"]);
  });

  it("rejects an unknown level or a malformed parent", async () => {
    expect((await request(app).get("/api/regions?level=city")).status).toBe(400);
    expect((await request(app).get("/api/regions?parent=9")).status).toBe(400);
    expect((await request(app).get("/api/regions?level=state&level=district")).status).toBe(400);
  });
});

describe("GET /api/indicators", () => {
  it("lists indicators sorted by name, without the European one", async () => {
    const res = await request(app).get("/api/indicators");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(5);
    expect(res.body.indicators.map((i: { id: string }) => i.id)).not.toContain("NA");
    expect(res.body.indicators[0]).toEqual({
      id: "7001",
      code: "sdg_bb",
      name: "(SDG 9) Breitbandversorgung privater Haushalte",
      area: "SDG",
      areaLabel: "Sustainable Development Goals",
    });
    expect(Object.keys(res.body.areas)).toEqual(["LRB", "ZOM", "SDG"]);
  });

  it("searches names and codes, ignoring case and umlaut spelling", async () => {
    const names = async (q: string) =>
      (await request(app).get(`/api/indicators?q=${encodeURIComponent(q)}`)).body.indicators.map((i: { name: string }) => i.name);
    expect(await names("arbeitslos")).toEqual(["Arbeitslose", "Arbeitslosenquote"]);
    expect(await names("ÄRZTE")).toEqual(["Kinderärzte"]);
    expect(await names("aerzte kinder")).toEqual(["Kinderärzte"]);
    expect(await names("q_alo")).toEqual(["Arbeitslosenquote"]);
    expect(await names("nothing like this")).toEqual([]);
  });

  it("filters by area, in any case", async () => {
    const res = await request(app).get("/api/indicators?area=zom");
    expect(res.body.indicators.map((i: { code: string }) => i.code)).toEqual(["hs_err"]);
  });

  it("rejects an unknown area or an overlong query", async () => {
    expect((await request(app).get("/api/indicators?area=EU")).status).toBe(400);
    expect((await request(app).get(`/api/indicators?q=${"x".repeat(101)}`)).status).toBe(400);
  });
});

describe("GET /api/sources", () => {
  it("describes each dataset without per-file checksums", async () => {
    const res = await request(app).get("/api/sources");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ count: 2, totalBytes: 3000 });
    expect(res.body.datasets[0]).toEqual({
      id: "inkar.2025",
      category: "multiple",
      title: "INKAR 2025",
      publisher: "BBSR",
      license: "dl-de/by-2-0",
      licenseVerified: true,
      trimmed: true,
      dir: "data/raw",
      fileCount: 2,
      bytes: 2000,
      fetchedAt: "2026-11-17",
      url: "https://example.org/inkar.zip",
      page: null,
      notes: null,
    });
    expect(JSON.stringify(res.body)).not.toContain("sha256");
  });

  it("filters by category", async () => {
    const res = await request(app).get("/api/sources?category=health");
    expect(res.body.datasets.map((d: { id: string }) => d.id)).toEqual(["health.krankenhausverzeichnis"]);
  });
});

describe("missing data", () => {
  const empty = createApp({ dataDir: fs.mkdtempSync(path.join(os.tmpdir(), "gv-empty-")) });

  it("answers 503 with a hint when data/raw hasn't been downloaded", async () => {
    for (const endpoint of ["/api/regions", "/api/indicators", "/api/sources"]) {
      const res = await request(empty).get(endpoint);
      expect(res.status, endpoint).toBe(503);
      expect(res.body.hint, endpoint).toMatch(/data\/README\.md/);
    }
  });
});

describe("helpers", () => {
  it("rejects CSV rows with the wrong number of fields instead of shifting columns", () => {
    expect(parseSemicolonCsv("a;b\n1;2\n")).toEqual([{ a: "1", b: "2" }]);
    expect(() => parseSemicolonCsv("a;b\n1;2;3\n")).toThrow(/Line 2/);
  });

  it("folds umlauts and ß for search", () => {
    expect(foldSearch("Größe Ärzte")).toBe("groesse aerzte");
  });
});

// The real files, when they've been downloaded (data/raw/ isn't in git).
const real = fs.existsSync(path.join(DEFAULT_DATA_DIR, "raw", "inkar", "inkar_regions.csv"));

describe.skipIf(!real)("with the real data", () => {
  const realApp = createApp({ dataDir: DEFAULT_DATA_DIR });

  it("has Germany, 16 states and 400 districts", async () => {
    const res = await request(realApp).get("/api/regions");
    const count = (level: string) => res.body.regions.filter((r: { level: string }) => r.level === level).length;
    expect([count("country"), count("state"), count("district")]).toEqual([1, 16, 400]);
  });

  it("has several hundred indicators, including the unemployment rate", async () => {
    const res = await request(realApp).get("/api/indicators?q=arbeitslosenquote");
    expect(res.body.indicators.map((i: { name: string }) => i.name)).toContain("Arbeitslosenquote");
    const all = await request(realApp).get("/api/indicators");
    expect(all.body.count).toBeGreaterThan(500);
  });

  it("lists every dataset in data/sources.json", async () => {
    const res = await request(realApp).get("/api/sources");
    expect(res.body.datasets.map((d: { id: string }) => d.id)).toEqual(expect.arrayContaining(["inkar.2025", "map.basemap_z9"]));
  });
});
