import { createSubscriber } from "svelte/reactivity";
import { getContext } from "svelte";
import type { Kernel } from "@rune-lab/core";
import { RUNE_LAB_CONTEXT } from "./context.ts";

export function getKernel<TCells = any>(): Kernel<TCells> {
  const kernel = getContext<Kernel<TCells>>(RUNE_LAB_CONTEXT.kernel);
  if (!kernel) {
    throw new Error(
      "[rune-lab] getKernel() found no Kernel. Did you wrap your application in <RuneProvider>?",
    );
  }
  return kernel;
}

export function useCell<TCells = any, K extends keyof TCells = any>(
  kernel: Kernel<TCells>,
  cellName: K,
): { current: TCells[K] } {
  // Fail-fast if cell doesn't exist by attempting to get its version
  kernel.getCellVersion(cellName);

  const subscribe = createSubscriber((update) => {
    return kernel.subscribe(cellName, update);
  });

  return {
    get current(): TCells[K] {
      if (typeof window !== "undefined") {
        subscribe();
      }
      return kernel.getCell(cellName);
    },
    set current(value: TCells[K]) {
      kernel.setCell(cellName, value);
    },
  };
}
