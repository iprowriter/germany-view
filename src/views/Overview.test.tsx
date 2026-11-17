import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STATE_SHAPES } from "../assets/germanyShapes";
import { ALL_ITEMS } from "../config/navigation";
import Overview from "./Overview";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

const render = async (onSelect = vi.fn()) => {
  await act(async () => root.render(<Overview onSelect={onSelect} />));
  return onSelect;
};

const cards = () => [...container.querySelectorAll<HTMLAnchorElement>("a.ovCard")];

describe("Overview", () => {
  it("has one card for every other page", async () => {
    await render();
    const linked = cards().map((a) => a.getAttribute("href"));
    const others = ALL_ITEMS.filter((i) => i.id !== "overview").map((i) => `#/${i.id}`);
    expect(linked.sort()).toEqual(others.sort());
  });

  it("shows each card's key figure", async () => {
    await render();
    for (const item of ALL_ITEMS.filter((i) => i.id !== "overview" && i.id !== "live" && i.id !== "sources")) {
      expect(container.textContent, item.id).toContain(item.keyFigure);
    }
  });

  it("opens a page from its card", async () => {
    const onSelect = await render();
    const health = cards().find((a) => a.getAttribute("href") === "#/health")!;
    await act(async () => health.click());
    expect(onSelect).toHaveBeenCalledWith("health");
  });

  it("draws Germany with its 16 states", async () => {
    await render();
    expect(STATE_SHAPES).toHaveLength(16);
    expect(container.querySelectorAll(".germanyMap__state")).toHaveLength(16);
    expect(container.querySelector(".germanyMap svg")?.getAttribute("aria-label")).toMatch(/Germany/);
  });

  it("names a state on hover", async () => {
    await render();
    const caption = container.querySelector(".germanyMap__caption")!;
    expect(caption.textContent).toBe("Hover a state");
    const bavaria = STATE_SHAPES.findIndex((s) => s.ags === "09");
    const path = container.querySelectorAll(".germanyMap__state")[bavaria];
    await act(async () => path.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })));
    expect(caption.textContent).toBe("Bayern");
  });

  it("marks placeholders as previews and invents no values", async () => {
    await render();
    expect(container.textContent).toContain("Preview");
    // Ranking rows show ranks and grey bars, never numbers for values.
    for (const row of container.querySelectorAll(".ovRanking li")) {
      expect(row.querySelectorAll(".skeleton")).toHaveLength(2);
    }
  });

  it("keeps controls that don't work yet disabled", async () => {
    await render();
    const buttons = [...container.querySelectorAll<HTMLButtonElement>(".ovHero button")];
    expect(buttons.length).toBeGreaterThan(0);
    for (const b of buttons) expect(b.disabled).toBe(true);
  });
});
