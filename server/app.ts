import compression from "compression";
import cors from "cors";
import express from "express";

/**
 * The HTTP API. For now it only answers a health check; routes for regions, indicators and the
 * offline basemap are added as the pages that need them are built.
 */
const app = express();

app.use(cors());
app.use(compression());
app.use(express.json());

app.get("/api", (_req, res) => {
  res.json({ name: "Germany View API", status: "ok" });
});

// Unknown API paths answer JSON, not Express's HTML error page.
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

export default app;
