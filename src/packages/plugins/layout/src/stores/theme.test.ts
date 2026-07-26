import { describe, expect, it } from "vite-plus/test";
import {
  createInMemoryDriver,
  namespaced,
  type SlotContext,
} from "rune-lab/core";
import { createThemeStore, type ThemeConfig } from "./theme.svelte.ts";

describe("createThemeStore precedence: persisted > explicit config > unset", () => {
  it("persisted choice wins over configured default", () => {
    const driver = createInMemoryDriver();
    // "rune-lab.layout:theme:" is the kernel's own pluginId:slotName: prefix
    // (wiring.ts) — the only prefix a persisted slot gets post-C15.
    const handle = namespaced(driver, "rune-lab.layout:theme:");
    handle.set("theme", "cupcake");

    const ctx: SlotContext<ThemeConfig> = {
      config: { default: "dark" },
      persistence: handle,
      stores: new Map(),
    };

    const store = createThemeStore(ctx);
    expect(store.current).toBe("cupcake");
  });

  it("configured default wins over unset when nothing is persisted", () => {
    const driver = createInMemoryDriver();
    const handle = namespaced(driver, "rune-lab.layout:theme:");

    const ctx: SlotContext<ThemeConfig> = {
      config: { default: "synthwave" },
      persistence: handle,
      stores: new Map(),
    };

    const store = createThemeStore(ctx);
    expect(store.current).toBe("synthwave");
  });

  it("stays unset (system) when no persisted or configured theme exists", () => {
    const driver = createInMemoryDriver();
    const handle = namespaced(driver, "rune-lab.layout:theme:");

    const ctx: SlotContext<ThemeConfig> = {
      config: undefined,
      persistence: handle,
      stores: new Map(),
    };

    const store = createThemeStore(ctx);
    expect(store.current).toBe("system");
  });

  it("an invalid configured theme also falls back to unset (system)", () => {
    const driver = createInMemoryDriver();
    const handle = namespaced(driver, "rune-lab.layout:theme:");

    const ctx: SlotContext<ThemeConfig> = {
      config: { default: "not-a-real-theme" },
      persistence: handle,
      stores: new Map(),
    };

    const store = createThemeStore(ctx);
    expect(store.current).toBe("system");
  });
});

describe("createThemeStore (C21): available narrows the single source of truth", () => {
  it("defaults to all 35 themes plus system when unconfigured", () => {
    const driver = createInMemoryDriver();
    const handle = namespaced(driver, "rune-lab.layout:theme:");

    const ctx: SlotContext<ThemeConfig> = {
      config: undefined,
      persistence: handle,
      stores: new Map(),
    };

    const store = createThemeStore(ctx);
    expect(store.available.length).toBe(36);
  });

  it("narrows `available` to the configured set, keeping system", () => {
    const driver = createInMemoryDriver();
    const handle = namespaced(driver, "rune-lab.layout:theme:");

    const ctx: SlotContext<ThemeConfig> = {
      config: { available: ["light", "dark", "dracula"] },
      persistence: handle,
      stores: new Map(),
    };

    const store = createThemeStore(ctx);
    expect(store.available.map((t) => t.name).sort()).toEqual(
      ["dark", "dracula", "light", "system"].sort(),
    );
  });
});
