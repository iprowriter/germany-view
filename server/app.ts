import compression from "compression";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import path from "node:path";
import { DEFAULT_DATA_DIR, REPO_ROOT } from "./config/paths.js";
import { DataFileMissingError } from "./data/files.js";
import { BadRequest, createCatalogRouter } from "./routes/catalog.js";

export interface AppOptions {
  /** Where sources.json and raw/ live. Default: DATA_DIR from the environment, else data/ in the repo. */
  dataDir?: string;
}

/** The HTTP API. Everything it serves is read from files in data/, so it works offline. */
export const createApp = ({ dataDir = process.env.DATA_DIR || DEFAULT_DATA_DIR }: AppOptions = {}) => {
  const app = express();

  app.use(cors());
  app.use(compression());
  app.use(express.json());

  app.get("/api", (_req, res) => {
    res.json({ name: "Germany View API", status: "ok" });
  });

  app.use("/api", createCatalogRouter(dataDir));

  // Unknown API paths answer JSON, not Express's HTML error page.
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(error);
    if (error instanceof BadRequest) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof DataFileMissingError) {
      // data/raw/ is downloaded, not committed: say so instead of a bare 500.
      res.status(503).json({
        error: "This data hasn't been downloaded yet.",
        file: path.relative(REPO_ROOT, error.file) || error.file,
        hint: "See data/README.md for where the files come from.",
      });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
};

export default createApp();
