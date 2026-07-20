import type { PersistenceDriver } from "rune-lab/core";
import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "../provider/context.ts";

export function usePersistence(): PersistenceDriver | undefined {
  return getContext<PersistenceDriver | undefined>(
    RUNE_LAB_CONTEXT.persistence,
  );
}
