import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "../mod.ts";
import type { PersistenceDriver } from "../mod.ts";

export function usePersistence(): PersistenceDriver | undefined {
  return getContext<PersistenceDriver | undefined>(
    RUNE_LAB_CONTEXT.persistence,
  );
}
