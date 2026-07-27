import {
  createInMemoryDriver,
  namespaced,
  type SlotContext,
} from "rune-lab/core";
import { describe, expect, it } from "vite-plus/test";
import { createThemeStore } from "./theme.svelte.ts";

describe("createThemeStore discovery", () => {
  it("persisted choice wins when persisted", () => {
    const driver = createInMemoryDriver();
    const handle = namespaced(driver, "rune-lab.layout:theme:");
    handle.set("theme", "cupcake");

    const ctx: SlotContext<unknown> = {
      config: undefined,
      persistence: handle,
      stores: new Map(),
    };

    const store = createThemeStore(ctx);
    expect(store.current).toBe("cupcake");
  });

  it("stays unset (system) when nothing is persisted", () => {
    const driver = createInMemoryDriver();
    const handle = namespaced(driver, "rune-lab.layout:theme:");

    const ctx: SlotContext<unknown> = {
      config: undefined,
      persistence: handle,
      stores: new Map(),
    };

    const store = createThemeStore(ctx);
    expect(store.current).toBe("system");
  });

  it("adds discovered themes to store via addItems", () => {
    const driver = createInMemoryDriver();
    const handle = namespaced(driver, "rune-lab.layout:theme:");

    const ctx: SlotContext<unknown> = {
      config: undefined,
      persistence: handle,
      stores: new Map(),
    };

    const store = createThemeStore(ctx);
    store.addItems([{ name: "light" }, { name: "dark" }, { name: "dracula" }]);

    expect(store.available.map((t) => t.name).sort()).toEqual(
      ["dark", "dracula", "light", "system"].sort(),
    );
  });
});
