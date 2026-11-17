import { cachedFile, parseSemicolonCsv, rawFile } from "./files.js";

export type RegionLevel = "country" | "state" | "district";

export interface Region {
  /** Official key: "DE" for Germany, 2 digits for a state, 5 for a district (AGS). */
  ags: string;
  name: string;
  level: RegionLevel;
  /** Key of the containing region; null for Germany. */
  parent: string | null;
  /** In the former GDR. Berlin was divided, so it and its district get null; Germany too. */
  east: boolean | null;
}

const EAST_STATES = new Set(["12", "13", "14", "15", "16"]);
const east = (state: string): boolean | null => (state === "11" ? null : EAST_STATES.has(state));

/**
 * Regions from INKAR's region list (data/raw/inkar/inkar_regions.csv, written by scripts/trim/inkar.sh):
 * B = Germany, L = states, K = districts (8-digit keys like 01001000, whose first 5 digits are the
 * AGS). WO (West/East aggregates) aren't places and are left out.
 */
export const parseRegions = (text: string): Region[] => {
  const regions: Region[] = [];
  for (const row of parseSemicolonCsv(text)) {
    const key = row.Kennziffer;
    if (row.Raumbezug === "B") {
      regions.push({ ags: "DE", name: "Deutschland", level: "country", parent: null, east: null });
    } else if (row.Raumbezug === "L") {
      regions.push({ ags: key, name: row.Name, level: "state", parent: "DE", east: east(key) });
    } else if (row.Raumbezug === "K") {
      const ags = key.slice(0, 5);
      regions.push({ ags, name: row.Name, level: "district", parent: ags.slice(0, 2), east: east(ags.slice(0, 2)) });
    }
  }
  const order: Record<RegionLevel, number> = { country: 0, state: 1, district: 2 };
  return regions.sort((a, b) => order[a.level] - order[b.level] || a.ags.localeCompare(b.ags));
};

const load = cachedFile(parseRegions);

export const REGIONS_FILE = ["inkar", "inkar_regions.csv"] as const;

export const loadRegions = (dataDir: string): Region[] => load(rawFile(dataDir, ...REGIONS_FILE));
