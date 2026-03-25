// sdk/state/src/registry/index.ts
// Store Registry — declarative map of context keys to store factories.
// RuneProvider iterates this at mount time to auto-wire all stores.

import type { StoreRegistryEntry } from "./types.ts";
import type { PersistenceDriver } from "@rune-lab/kernel";

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
const STORE_REGISTRY = new Map<string, StoreRegistryEntry>();

/**
 * Register a store entry in the global registry.
 * Must be called before RuneProvider mounts for the store to be auto-wired.
 *
 * @param entry - Store registry entry with key, factory, and options.
 * @throws Error if a store with the same key is already registered.
 */
export function registerStore(entry: StoreRegistryEntry): void {
  if (STORE_REGISTRY.has(entry.key)) {
    console.warn(
      `[StoreRegistry] Overwriting existing store registration for key "${entry.key}"`,
    );
  }
  STORE_REGISTRY.set(entry.key, entry);
}

/**
 * Get a registered store entry by key.
 */
export function getRegisteredStore(
  key: string,
): StoreRegistryEntry | undefined {
  return STORE_REGISTRY.get(key);
}

/**
 * Get all registered store entries.
 */
export function getAllRegisteredStores(): Map<string, StoreRegistryEntry> {
  return STORE_REGISTRY;
}

/**
 * Remove a store registration (primarily useful for testing).
 */
export function unregisterStore(key: string): boolean {
  return STORE_REGISTRY.delete(key);
}

/**
 * Clear all store registrations (primarily useful for testing).
 */
export function clearRegistry(): void {
  STORE_REGISTRY.clear();
}

/**
 * Topologically sort registry entries by `dependsOn` to ensure correct creation order.
 * Entries with no dependencies come first; entries depending on others come after.
 */
function topologicalSort(entries: StoreRegistryEntry[]): StoreRegistryEntry[] {
  const sorted: StoreRegistryEntry[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>(); // cycle detection

  const entryMap = new Map(entries.map((e) => [e.key, e]));

  function visit(entry: StoreRegistryEntry) {
    if (visited.has(entry.key)) return;
    if (visiting.has(entry.key)) {
      throw new Error(
        `[StoreRegistry] Circular dependency detected involving "${entry.key}"`,
      );
    }

    visiting.add(entry.key);

    for (const depKey of entry.dependsOn ?? []) {
      const dep = entryMap.get(depKey);
      if (dep) visit(dep);
    }

    visiting.delete(entry.key);
    visited.add(entry.key);
    sorted.push(entry);
  }

  for (const entry of entries) {
    visit(entry);
  }

  return sorted;
}

/**
 * Initialize all registered stores using the provided config and driver.
 * Resolves dependencies via topological sort and returns a map of key → store instance.
 *
 * @param config - The RuneLabConfig, used to check conditional keys and pass to factories
 * @param driver - The resolved PersistenceDriver
 * @returns Map of store key → created store instance
 */
export function initializeStores(
  config: Record<string, unknown>,
  driver: PersistenceDriver,
): Map<string, unknown> {
  const entries = Array.from(STORE_REGISTRY.values());
  const sorted = topologicalSort(entries);
  const stores = new Map<string, unknown>();

  for (const entry of sorted) {
    // Skip conditional stores when their config key is absent
    if (entry.conditional && !(entry.conditional in config)) {
      continue;
    }

    const store = entry.factory(config, driver, stores);

    if (store === null && entry.optional) {
      continue; // Optional store chose not to create
    }

    if (store !== null && store !== undefined) {
      stores.set(entry.key, store);
    }
  }

  return stores;
}

export { STORE_REGISTRY };
