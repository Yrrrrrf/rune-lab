import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "@rune-lab/kernel";
import type { PersistenceDriver } from "@rune-lab/kernel";

export function usePersistence(): PersistenceDriver | undefined {
  return getContext<PersistenceDriver | undefined>(
    RUNE_LAB_CONTEXT.persistence,
  );
}
