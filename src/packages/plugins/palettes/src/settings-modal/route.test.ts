import { describe, expect, it, vi } from "vite-plus/test";
import { createPaletteRegistryStore } from "../registry/registry.svelte.ts";
import { installSettingsRoute } from "./route.svelte.ts";

describe("installSettingsRoute router adapter and fallback behavior", () => {
  it("uses provided router adapter for replaceState and pushState", async () => {
    const replaceFn = vi.fn();
    const pushFn = vi.fn();

    const registry = createPaletteRegistryStore({
      router: {
        replaceState: replaceFn,
        pushState: pushFn,
      },
    });

    const cleanup = installSettingsRoute(registry);

    // Open settings section -> replaceState expected
    registry.open("settings", "general");
    await Promise.resolve();

    expect(replaceFn).toHaveBeenCalledWith("#settings/general");
    expect(pushFn).not.toHaveBeenCalled();

    replaceFn.mockClear();

    // Close settings when hash starts with #settings -> pushState expected
    globalThis.location.hash = "#settings/general";
    registry.close();
    await Promise.resolve();

    expect(pushFn).toHaveBeenCalledWith(
      globalThis.location.pathname + globalThis.location.search,
    );

    cleanup();
  });

  it("falls back to raw history API when no router adapter is provided", async () => {
    const registry = createPaletteRegistryStore(); // No router provided

    const origReplaceState = history.replaceState;
    const origPushState = history.pushState;

    const replaceSpy = vi.fn();
    const pushSpy = vi.fn();

    history.replaceState = replaceSpy;
    history.pushState = pushSpy;

    try {
      const cleanup = installSettingsRoute(registry);

      // Open settings section -> history.replaceState fallback expected
      registry.open("settings", "appearance");
      await Promise.resolve();

      expect(replaceSpy).toHaveBeenCalledWith(null, "", "#settings/appearance");

      replaceSpy.mockClear();

      // Close settings when hash starts with #settings -> history.pushState fallback expected
      globalThis.location.hash = "#settings/appearance";
      registry.close();
      await Promise.resolve();

      expect(pushSpy).toHaveBeenCalledWith(
        null,
        "",
        globalThis.location.pathname + globalThis.location.search,
      );

      cleanup();
    } finally {
      history.replaceState = origReplaceState;
      history.pushState = origPushState;
    }
  });
});
