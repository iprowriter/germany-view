// Load server/.env before anything else: ES modules run all imports first, so calling
// dotenv.config() after `import app` would be too late for code that reads the environment
// while the app is being set up.
import "dotenv/config";
import app from "./app.js";
import { DEFAULT_PORT } from "./config/server.js";

const PORT = Number(process.env.PORT) || DEFAULT_PORT;

const server = app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});

const shutdown = (signal: string) => {
  console.log(`${signal}: shutting down`);
  server.close(() => process.exit(0));
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
