import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_PAGE } from "./config/navigation";
import { pageFromHash, useHashRoute } from "./useHashRoute";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("pageFromHash", () => {
  it("reads the page id from the hash", () => {
    expect(pageFromHash("#/health")).toBe("health");
    expect(pageFromHash("#health")).toBe("health");
  });

  it("ignores anything after the page id", () => {
    expect(pageFromHash("#/profile/05315")).toBe("profile");
    expect(pageFromHash("#/compare?a=1")).toBe("compare");
  });

  it("falls back to the default page for empty or unknown hashes", () => {
    expect(pageFromHash("")).toBe(DEFAULT_PAGE);
    expect(pageFromHash("#/")).toBe(DEFAULT_PAGE);
    expect(pageFromHash("#/does-not-exist")).toBe(DEFAULT_PAGE);
  });
});

describe("useHashRoute", () => {
  afterEach(() => {
    window.location.hash = "";
  });

  it("follows the hash and navigates by changing it", async () => {
    window.location.hash = "/energy";
    let route: [string, (id: string) => void] = ["", () => {}];
    const Probe = () => {
      route = useHashRoute();
      return null;
    };
    const root = createRoot(document.createElement("div"));
    await act(async () => root.render(createElement(Probe)));
    expect(route[0]).toBe("energy");

    await act(async () => {
      route[1]("health");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(window.location.hash).toBe("#/health");
    expect(route[0]).toBe("health");
    await act(async () => root.unmount());
  });
});
