import { Effect, SubscriptionRef } from "effect";
import {
  createInMemoryDriver,
  createKernel,
  definePlugin,
  StateCell,
} from "rune-lab/core";
import { describe, expect, it } from "vite-plus/test";
import { createDataStore } from "./reactivity/data-store.svelte.ts";
import { useCell } from "./reactivity/use-cell.svelte.ts";

describe("useCell reactivity bridge", () => {
  it("should read, write, and subscribe to a cell against a kernel slot", async () => {
    const driver = createInMemoryDriver();
    const cellInstance = new StateCell(
      SubscriptionRef.make("light").pipe(Effect.runSync),
    );

    const testPlugin = definePlugin({
      id: "test",
      slots: {
        theme: {
          create: () => cellInstance,
        },
      },
    });

    const kernel = createKernel([testPlugin], {
      config: {},
      persistence: driver,
    });

    const themeCell = useCell(kernel, "rl:test:theme");

    // Read initial
    expect(themeCell.current).toBe("light");

    // Write to cell
    themeCell.current = "dark";
    expect(themeCell.current).toBe("dark");
    expect(kernel.getCell("rl:test:theme")).toBe("dark");

    // Cleanup
    await kernel.dispose();
  });
});

describe("createDataStore", () => {
  it("starts with all-null data, copies only defined keys on init, and ignores second init", () => {
    const keys = ["name", "version", "icon"] as const;
    const store = createDataStore<
      { name: string; version: string; icon?: string }
    >(keys);

    expect(store.data.name).toBeNull();
    expect(store.data.version).toBeNull();
    expect(store.data.icon).toBeNull();

    store.init({ name: "My App", version: "1.0.0" });
    expect(store.data.name).toBe("My App");
    expect(store.data.version).toBe("1.0.0");
    expect(store.data.icon).toBeNull();

    // Second init no-ops
    store.init({ name: "Overwritten App" });
    expect(store.data.name).toBe("My App");
  });
});
