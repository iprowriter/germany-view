import express, { type Request, type Response } from "express";
import { foldSearch, INDICATOR_AREAS, loadIndicators, type IndicatorArea } from "../data/indicators.js";
import { loadRegions, type RegionLevel } from "../data/regions.js";
import { loadSources } from "../data/sources.js";

const LEVELS: readonly RegionLevel[] = ["country", "state", "district"];
const MAX_QUERY_LENGTH = 100;

/** A single optional string query parameter; arrays (?a=1&a=2) are a client error. */
const queryParam = (req: Request, name: string): string | undefined => {
  const value = req.query[name];
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new BadRequest(`${name} must be given once`);
  return value.trim() || undefined;
};

export class BadRequest extends Error {}

/**
 * Catalogue endpoints: what the app can show, read from files in data/ (no database).
 *
 *   GET /api/regions     Germany, 16 states, 400 districts       ?level=state|district|country  ?parent=09
 *   GET /api/indicators  ~560 INKAR indicators                    ?q=arzt  ?area=LRB|ZOM|SDG
 *   GET /api/sources     every dataset with licence and size      ?category=health
 */
export const createCatalogRouter = (dataDir: string) => {
  const router = express.Router();

  router.get("/regions", (req: Request, res: Response) => {
    const level = queryParam(req, "level");
    const parent = queryParam(req, "parent");
    if (level && !LEVELS.includes(level as RegionLevel)) {
      throw new BadRequest(`level must be one of: ${LEVELS.join(", ")}`);
    }
    if (parent && !/^(DE|\d{2})$/.test(parent)) throw new BadRequest('parent must be "DE" or a 2-digit state key');
    const regions = loadRegions(dataDir).filter((r) => (!level || r.level === level) && (!parent || r.parent === parent));
    res.json({ count: regions.length, regions });
  });

  router.get("/indicators", (req: Request, res: Response) => {
    const q = queryParam(req, "q");
    const area = queryParam(req, "area")?.toUpperCase();
    if (q && q.length > MAX_QUERY_LENGTH) throw new BadRequest(`q must be at most ${MAX_QUERY_LENGTH} characters`);
    if (area && !(area in INDICATOR_AREAS)) {
      throw new BadRequest(`area must be one of: ${Object.keys(INDICATOR_AREAS).join(", ")}`);
    }
    // Every word must appear in the name or code: "ärzte kinder" finds "Kinderärzte".
    const words = q ? foldSearch(q).split(/\s+/) : [];
    const indicators = loadIndicators(dataDir).filter((i) => {
      if (area && i.area !== (area as IndicatorArea)) return false;
      const haystack = foldSearch(`${i.name} ${i.code}`);
      return words.every((w) => haystack.includes(w));
    });
    res.json({ count: indicators.length, areas: INDICATOR_AREAS, indicators });
  });

  router.get("/sources", (req: Request, res: Response) => {
    const category = queryParam(req, "category");
    const { totalBytes, datasets } = loadSources(dataDir);
    const selected = category ? datasets.filter((d) => d.category === category) : datasets;
    res.json({ count: selected.length, totalBytes, datasets: selected });
  });

  return router;
};
