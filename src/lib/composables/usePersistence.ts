import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "$lib/context";
import type { PersistenceDriver } from "$lib/persistence/types";

export function usePersistence(): PersistenceDriver | undefined {
  return getContext<PersistenceDriver | undefined>(
    RUNE_LAB_CONTEXT.persistence,
  );
}
