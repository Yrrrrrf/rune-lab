import { Effect, SubscriptionRef } from "effect";
import {
  createInMemoryDriver,
  createKernel,
  definePlugin,
  StateCell,
} from "rune-lab/core";
import { describe, expect, it } from "vite-plus/test";
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
