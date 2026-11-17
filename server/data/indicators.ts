import { cachedFile, parseSemicolonCsv, rawFile } from "./files.js";

/** INKAR's indicator groups ("Bereich"). */
export const INDICATOR_AREAS = {
  LRB: "Regional monitoring",          // Laufende Raumbeobachtung: the core set
  ZOM: "Access to central places",     // Zentrale-Orte-Monitoring: distances, stops, hospitals by reach
  SDG: "Sustainable Development Goals", // SDG indicators for municipalities
} as const;

export type IndicatorArea = keyof typeof INDICATOR_AREAS;

export interface Indicator {
  /** INKAR indicator id, the key in inkar_observations.csv. */
  id: string;
  /** INKAR short code, e.g. "alo". */
  code: string;
  /** Name as published (German), e.g. "Arbeitslosenquote". */
  name: string;
  area: IndicatorArea;
  areaLabel: string;
}

const isArea = (s: string): s is IndicatorArea => s in INDICATOR_AREAS;

/**
 * Indicators from data/raw/inkar/inkar_indicators.csv. The one European indicator (area "EU", id
 * "NA") has no district values and is left out.
 */
export const parseIndicators = (text: string): Indicator[] =>
  parseSemicolonCsv(text)
    .filter((r) => isArea(r.Bereich) && /^\d+$/.test(r.ID))
    .map((r) => {
      const area = r.Bereich as IndicatorArea;
      return { id: r.ID, code: r.Kuerzel, name: r.Indikator, area, areaLabel: INDICATOR_AREAS[area] };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "de") || a.id.localeCompare(b.id));

const load = cachedFile(parseIndicators);

export const INDICATORS_FILE = ["inkar", "inkar_indicators.csv"] as const;

export const loadIndicators = (dataDir: string): Indicator[] => load(rawFile(dataDir, ...INDICATORS_FILE));

/** Folds case and German umlauts so "ärzte", "Aerzte" and "ÄRZTE" all match "Ärzte". */
export const foldSearch = (s: string): string =>
  s
    .toLocaleLowerCase("de")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
