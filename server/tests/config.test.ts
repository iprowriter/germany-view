import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DEFAULT_PORT } from "../config/server.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("ports", () => {
  it("the frontend's default API URL points at the backend's default port", () => {
    expect(read("src/config/api.ts")).toContain(`http://localhost:${DEFAULT_PORT}"`);
  });

  it("the example env files agree with the defaults", () => {
    expect(read(".env.example")).toContain(`VITE_API_URL=http://localhost:${DEFAULT_PORT}`);
    expect(read("server/.env.example")).toContain(`PORT=${DEFAULT_PORT}`);
  });

  it("avoids ports taken by macOS AirPlay (5000) and Berlin Visualized (5001)", () => {
    expect([5000, 5001]).not.toContain(DEFAULT_PORT);
  });
});
