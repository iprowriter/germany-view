import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../app.js";

describe("API", () => {
  it("answers the health check", async () => {
    const res = await request(app).get("/api");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: "Germany View API", status: "ok" });
  });

  it("answers unknown API paths with a JSON 404", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.type).toMatch(/json/);
    expect(res.body).toEqual({ error: "Not found" });
  });

  it("allows the frontend's origin (CORS)", async () => {
    const res = await request(app).get("/api").set("Origin", "http://localhost:5173");
    expect(res.headers["access-control-allow-origin"]).toBe("*");
  });
});
