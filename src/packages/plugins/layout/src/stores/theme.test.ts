import { describe, expect, it } from "vite-plus/test";
import {
  createInMemoryDriver,
  namespaced,
  type SlotContext,
} from "rune-lab/core";
import { createThemeStore } from "./theme.svelte.ts";

describe("createThemeStore precedence: persisted > explicit config > unset", () => {
  it("persisted choice wins over configured default", () => {
    const driver = createInMemoryDriver();
    // The "rl:" here comes from RuneProvider's provider-level namespacing,
    // not from the kernel (see C15) — kept so this asserts the real key shape.
    const handle = namespaced(driver, "rl:rune-lab.layout:theme:");
    handle.set("theme", "cupcake");

    const ctx: SlotContext<unknown> = {
      config: "dark",
      persistence: handle,
      stores: new Map(),
    };

    const store = createThemeStore(ctx);
    expect(store.current).toBe("cupcake");
  });

  it("configured default wins over unset when nothing is persisted", () => {
    const driver = createInMemoryDriver();
    const handle = namespaced(driver, "rl:rune-lab.layout:theme:");

    const ctx: SlotContext<unknown> = {
      config: "synthwave",
      persistence: handle,
      stores: new Map(),
    };

    const store = createThemeStore(ctx);
    expect(store.current).toBe("synthwave");
  });

  it("stays unset (system) when no persisted or configured theme exists", () => {
    const driver = createInMemoryDriver();
    const handle = namespaced(driver, "rl:rune-lab.layout:theme:");

    const ctx: SlotContext<unknown> = {
      config: undefined,
      persistence: handle,
      stores: new Map(),
    };

    const store = createThemeStore(ctx);
    expect(store.current).toBe("system");
  });

  it("an invalid configured theme also falls back to unset (system)", () => {
    const driver = createInMemoryDriver();
    const handle = namespaced(driver, "rl:rune-lab.layout:theme:");

    const ctx: SlotContext<unknown> = {
      config: "not-a-real-theme",
      persistence: handle,
      stores: new Map(),
    };

    const store = createThemeStore(ctx);
    expect(store.current).toBe("system");
  });
});
