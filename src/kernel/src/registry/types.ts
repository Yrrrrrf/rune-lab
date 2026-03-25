// sdk/state/src/registry/types.ts
// Types for the Store Registry — the declarative store auto-wiring engine.

import type { PersistenceDriver } from "@rune-lab/kernel";

/**
 * Factory function signature for creating a store.
 * Receives the resolved config, driver, and a map of already-created store instances.
 * The `stores` map enables dependency injection between stores.
 */
export type StoreFactory<TConfig = unknown, TStore = unknown> = (
  config: TConfig,
  driver: PersistenceDriver,
  stores: Map<string, unknown>,
) => TStore | null;

/**
 * An entry in the Store Registry.
 * Maps a context key to its factory function and metadata.
 */
export interface StoreRegistryEntry<TConfig = unknown, TStore = unknown> {
  /** Unique key matching the RUNE_LAB_CONTEXT key (e.g., "theme", "language") */
  key: string;
  /** Factory function that creates the store */
  factory: StoreFactory<TConfig, TStore>;
  /** If true, the store is optional — null return from factory means "skip" */
  optional?: boolean;
  /** If true, the store does not use persistence at all */
  noPersistence?: boolean;
  /**
   * Keys of other stores that must be created before this one.
   * The registry initializer topologically sorts entries by this field.
   */
  dependsOn?: string[];
  /**
   * Config key that must be present for this store to be created.
   * Used for opt-in stores (e.g., "cart", "auth").
   * When undefined, the store is always created.
   */
  conditional?: string;
}
