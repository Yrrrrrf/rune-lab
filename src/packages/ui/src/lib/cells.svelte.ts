import type { Kernel, RuneLabCells } from "@rune-lab/core";
import { BROWSER } from "esm-env";
import { getContext } from "svelte";
import { createSubscriber } from "svelte/reactivity";
import { RUNE_LAB_CONTEXT } from "./context.ts";

export function getKernel<TCells = RuneLabCells>(): Kernel<TCells> {
  const kernel = getContext<Kernel<TCells>>(RUNE_LAB_CONTEXT.kernel);
  if (!kernel) {
    throw new Error(
      "[rune-lab] getKernel() found no Kernel. Did you wrap your application in <RuneProvider>?",
    );
  }
  return kernel;
}

/**
 * A reactive read/write view over a kernel cell.
 *
 * Behavioral facts:
 * 1. Cells carry `$state.raw` semantics: reassign `.current`, do not mutate properties directly (nested mutations are invisible).
 * 2. The context-resolving form `useCell(cellName)` must be called during component initialization (uses Svelte's `getContext`).
 * 3. SSR reads are plain, unsubscribed reads (reactivity registration is bypassed on the server).
 */
export function useCell<
  TCells = RuneLabCells,
  K extends keyof TCells = keyof TCells,
>(cellName: K): { current: TCells[K] };
export function useCell<
  TCells = RuneLabCells,
  K extends keyof TCells = keyof TCells,
>(kernel: Kernel<TCells>, cellName: K): { current: TCells[K] };
export function useCell<
  TCells = RuneLabCells,
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
