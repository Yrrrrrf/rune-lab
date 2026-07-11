import { describe, expect, it } from "vite-plus/test";
import { createKernel } from "@rune-lab/core";
import { useCell } from "./cells.svelte.ts";
import { createInMemoryDriver } from "@rune-lab/core";

describe("useCell reactivity bridge", () => {
  it("should read, write, and subscribe to a cell against a bare kernel", async () => {
    const driver = createInMemoryDriver();
    const kernel = createKernel([], {
      config: {},
      persistence: driver,
    });

    const themeCell = useCell(kernel, "theme");

    // Read initial
    expect(themeCell.current).toBe("light");

    // Write to cell
    themeCell.current = "dark";
    expect(themeCell.current).toBe("dark");
    expect(kernel.getCell("theme")).toBe("dark");

    // Cleanup
    await kernel.dispose();
  });
});
