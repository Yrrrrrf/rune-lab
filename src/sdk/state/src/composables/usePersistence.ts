import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "../context";
import type { PersistenceDriver } from "@internal/core";

export function usePersistence(): PersistenceDriver | undefined {
  return getContext<PersistenceDriver | undefined>(
    RUNE_LAB_CONTEXT.persistence,
  );
}
