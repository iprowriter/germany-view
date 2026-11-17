import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "./App";

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
  window.location.hash = "";
});

const heading = () => container.querySelector("main h1")?.textContent;

describe("App", () => {
  it("opens on the Overview", async () => {
    await act(async () => root.render(<App />));
    expect(heading()).toBe("Overview");
  });

  it("shows the page named in the URL", async () => {
    window.location.hash = "/justice-safety";
    await act(async () => root.render(<App />));
    expect(heading()).toBe("Justice & public safety");
  });

  it("switches page from the sidebar", async () => {
    await act(async () => root.render(<App />));
    const environment = [...container.querySelectorAll<HTMLAnchorElement>(".sidebar__item")].find(
      (a) => a.textContent === "Environment",
    )!;
    await act(async () => {
      environment.click();
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(window.location.hash).toBe("#/environment");
    expect(heading()).toBe("Environment");
    expect(container.textContent).toContain("environment.uba_air");
  });
});
