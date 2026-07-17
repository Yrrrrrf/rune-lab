import type { Kernel } from "@rune-lab/core";
import { BROWSER } from "esm-env";
import { createSubscriber } from "svelte/reactivity";
import { getKernel } from "../provider/context.ts";

export function useCell<
  TCells = Record<string, unknown>,
  K extends keyof TCells = keyof TCells,
>(cellName: K): { current: TCells[K] };
export function useCell<
  TCells = Record<string, unknown>,
  K extends keyof TCells = keyof TCells,
>(kernel: Kernel<TCells>, cellName: K): { current: TCells[K] };
export function useCell<
  TCells = Record<string, unknown>,
  K extends keyof TCells = keyof TCells,
>(first: Kernel<TCells> | K, second?: K): { current: TCells[K] } {
  let kernel: Kernel<TCells>;
  let cellName: K;

  if (second !== undefined) {
    kernel = first as Kernel<TCells>;
    cellName = second;
  } else {
    kernel = getKernel<TCells>();
    cellName = first as K;
  }

  // Fail-fast if cell doesn't exist by attempting to get its version
  kernel.getCellVersion(cellName);

  const subscribe = createSubscriber((update) => {
    return kernel.subscribe(cellName, update);
  });

  return {
    get current(): TCells[K] {
      if (BROWSER) {
        subscribe();
      }
      return kernel.getCell(cellName);
    },
    set current(value: TCells[K]) {
      kernel.setCell(cellName, value);
    },
  };
}
