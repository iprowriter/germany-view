import path from "node:path";
import { cachedFile } from "./files.js";

/** One dataset as the API describes it: provenance without per-file checksums. */
export interface SourceSummary {
  id: string;
  category: string;
  title: string;
  publisher: string;
  license: string;
  licenseVerified: boolean;
  trimmed: boolean;
  /** Where the files live, relative to the repo: "data/raw" or "data/map". */
  dir: string;
  fileCount: number;
  bytes: number;
  fetchedAt: string | null;
  url: string | null;
  page: string | null;
  notes: string | null;
}

export interface SourcesSummary {
  totalBytes: number;
  datasets: SourceSummary[];
}

interface ManifestEntry {
  id: string;
  category: string;
  title: string;
  publisher: string;
  license: string;
  licenseVerified?: boolean;
  trimmed?: boolean;
  dir?: string;
  files?: unknown[];
  bytes?: number;
  fetchedAt?: string;
  url?: string;
  page?: string;
  notes?: string;
}

/** data/sources.json (written by scripts/manifest.py, tracked in git, so present on every checkout). */
export const parseSources = (text: string): SourcesSummary => {
  const json = JSON.parse(text) as { datasets?: ManifestEntry[]; totalBytes?: number };
  if (!Array.isArray(json.datasets)) throw new Error('sources.json: expected a "datasets" array');
  const datasets = json.datasets.map((d) => ({
    id: d.id,
    category: d.category,
    title: d.title,
    publisher: d.publisher,
    license: d.license,
    licenseVerified: d.licenseVerified ?? false,
    trimmed: d.trimmed ?? false,
    dir: d.dir ?? "data/raw",
    fileCount: d.files?.length ?? 0,
    bytes: d.bytes ?? 0,
    fetchedAt: d.fetchedAt ?? null,
    url: d.url ?? null,
    page: d.page ?? null,
    notes: d.notes ?? null,
  }));
  return { totalBytes: json.totalBytes ?? datasets.reduce((n, d) => n + d.bytes, 0), datasets };
};

const load = cachedFile(parseSources);

export const loadSources = (dataDir: string): SourcesSummary => load(path.join(dataDir, "sources.json"));
