import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "../context.ts";
import type { PersistenceDriver } from "@rune-lab/core";

export function usePersistence(): PersistenceDriver | undefined {
  return getContext<PersistenceDriver | undefined>(
    RUNE_LAB_CONTEXT.persistence,
  );
}
