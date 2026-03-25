import type { StoreRegistryEntry } from "./types.ts";
import type { PersistenceDriver } from "@rune-lab/core";
export type { StoreFactory, StoreRegistryEntry } from "./types.ts";
/**
 * The global store registry.
 * Pre-populated with built-in stores by RuneProvider.
 * Third-party plugins can register additional entries before mounting.
 *
 * @example
 * ```ts
 * // Plugin registration (before RuneProvider mounts)
 * registerStore({
 *   key: "analytics",
 *   factory: (config, driver) => createAnalyticsStore(config),
 *   optional: true,
 *   noPersistence: true,
 * });
 * ```
 */
declare const STORE_REGISTRY: Map<string, StoreRegistryEntry<unknown, unknown>>;
/**
 * Register a store entry in the global registry.
 * Must be called before RuneProvider mounts for the store to be auto-wired.
 *
 * @param entry - Store registry entry with key, factory, and options.
 * @throws Error if a store with the same key is already registered.
 */
export declare function registerStore(entry: StoreRegistryEntry): void;
/**
 * Get a registered store entry by key.
 */
export declare function getRegisteredStore(
  key: string,
): StoreRegistryEntry | undefined;
/**
 * Get all registered store entries.
 */
export declare function getAllRegisteredStores(): Map<
  string,
  StoreRegistryEntry
>;
/**
 * Remove a store registration (primarily useful for testing).
 */
export declare function unregisterStore(key: string): boolean;
/**
 * Clear all store registrations (primarily useful for testing).
 */
export declare function clearRegistry(): void;
/**
 * Initialize all registered stores using the provided config and driver.
 * Resolves dependencies via topological sort and returns a map of key → store instance.
 *
 * @param config - The RuneLabConfig, used to check conditional keys and pass to factories
 * @param driver - The resolved PersistenceDriver
 * @returns Map of store key → created store instance
 */
export declare function initializeStores(
  config: Record<string, unknown>,
  driver: PersistenceDriver,
): Map<string, unknown>;
export { STORE_REGISTRY };
