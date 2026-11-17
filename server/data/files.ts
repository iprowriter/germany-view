import fs from "node:fs";
import path from "node:path";

/**
 * A data file the API needs isn't there. data/raw/ is downloaded, not committed, so on a fresh
 * checkout this is expected: routes answer 503 with a hint instead of crashing.
 */
export class DataFileMissingError extends Error {
  constructor(readonly file: string) {
    super(`Data file not found: ${file}`);
    this.name = "DataFileMissingError";
  }
}

/**
 * Reads a file once and keeps the parsed result, re-reading only when the file changes (new
 * download). The files are small (kB to a few MB) and read-only, so memory is the right cache.
 */
export const cachedFile = <T>(parse: (text: string) => T) => {
  const cache = new Map<string, { mtimeMs: number; size: number; value: T }>();
  return (file: string): T => {
    let stat: fs.Stats;
    try {
      stat = fs.statSync(file);
    } catch {
      throw new DataFileMissingError(file);
    }
    const hit = cache.get(file);
    if (hit && hit.mtimeMs === stat.mtimeMs && hit.size === stat.size) return hit.value;
    const value = parse(fs.readFileSync(file, "utf8"));
    cache.set(file, { mtimeMs: stat.mtimeMs, size: stat.size, value });
    return value;
  };
};

/**
 * Parses a semicolon-separated file with a header row, as INKAR publishes it. These files use no
 * quoting (checked by the INKAR trim), so a field never contains a semicolon; a row with the wrong
 * number of fields is an error rather than silently shifted columns.
 */
export const parseSemicolonCsv = (text: string): Record<string, string>[] => {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.length > 0);
  if (!lines.length) return [];
  const header = lines[0].split(";");
  return lines.slice(1).map((line, i) => {
    const fields = line.split(";");
    if (fields.length !== header.length) {
      throw new Error(`Line ${i + 2}: expected ${header.length} fields, found ${fields.length}`);
    }
    return Object.fromEntries(header.map((h, j) => [h, fields[j]]));
  });
};

export const rawFile = (dataDir: string, ...parts: string[]) => path.join(dataDir, "raw", ...parts);
