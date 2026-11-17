import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ALL_ITEMS } from "../../config/navigation";
import Sidebar from "./Sidebar";

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

const render = async (current: string, onSelect = vi.fn()) => {
  await act(async () => root.render(<Sidebar current={current} onSelect={onSelect} />));
  return onSelect;
};

const links = () => [...container.querySelectorAll<HTMLAnchorElement>(".sidebar__item")];

describe("Sidebar", () => {
  it("shows every page, under the headings Explore, Decide and Themes", async () => {
    await render("overview");
    expect(links().map((a) => a.textContent)).toEqual(ALL_ITEMS.map((i) => i.label));
    expect([...container.querySelectorAll("h2")].map((h) => h.textContent)).toEqual(["Explore", "Decide", "Themes"]);
  });

  it("links each page to its hash", async () => {
    await render("overview");
    expect(links().map((a) => a.getAttribute("href"))).toEqual(ALL_ITEMS.map((i) => `#/${i.id}`));
  });

  it("marks only the current page", async () => {
    await render("energy");
    const current = links().filter((a) => a.getAttribute("aria-current") === "page");
    expect(current.map((a) => a.textContent)).toEqual(["Energy"]);
    expect(current[0].classList).toContain("sidebar__item--active");
  });

  it("reports the selected page", async () => {
    const onSelect = await render("overview");
    const health = links().find((a) => a.textContent === "Health")!;
    await act(async () => health.click());
    expect(onSelect).toHaveBeenCalledWith("health");
  });

  it("opens and closes the menu on narrow screens, and closes it after a choice", async () => {
    await render("overview");
    const toggle = container.querySelector<HTMLButtonElement>(".sidebar__toggle")!;
    const sidebar = container.querySelector(".sidebar")!;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    await act(async () => toggle.click());
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(sidebar.classList).toContain("sidebar--open");

    await act(async () => links()[1].click());
    expect(sidebar.classList).not.toContain("sidebar--open");
  });
});
