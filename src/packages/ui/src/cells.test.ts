import {
  createInMemoryDriver,
  createKernel,
  definePlugin,
} from "rune-lab/core";
import { describe, expect, it } from "vite-plus/test";
import { createDataStore } from "./reactivity/data-store.svelte.ts";
import { useCell } from "./reactivity/use-cell.svelte.ts";

describe("useCell reactivity bridge", () => {
  it("should read, write, and subscribe to contributions cell against kernel", async () => {
    const driver = createInMemoryDriver();
    const testPlugin = definePlugin({
      id: "test",
    });

    const kernel = createKernel([testPlugin], {
      persistence: driver,
    });

    const contribCell = useCell(kernel, "contributions");

    expect(contribCell.current).toBeDefined();

    await kernel.dispose();
  });
});

describe("createDataStore", () => {
  it("starts with all-null data, copies only defined keys on init, and ignores second init", () => {
    const keys = ["name", "version", "icon"] as const;
    const store = createDataStore<{
      name: string;
      version: string;
      icon?: string;
    }>(keys);

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
