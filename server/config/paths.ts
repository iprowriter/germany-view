import path from "node:path";
import { fileURLToPath } from "node:url";

/** Absolute paths the server shares with the data scripts. Everything hangs off the repo root. */
const here = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(here, "..", "..");

/** data/: sources.json (tracked) plus raw/ and map/ (downloaded, gitignored). Override with DATA_DIR. */
export const DEFAULT_DATA_DIR = path.join(REPO_ROOT, "data");
