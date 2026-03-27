import type { PersistenceDriver } from "@rune-lab/kernel";
import type { Component } from "svelte";

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
  /** The symbol used for Svelte context (e.g., RUNE_LAB_CONTEXT.theme) */
  contextKey?: symbol;
  /** The ID of the plugin that registered this store */
  pluginId?: string;
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

/**
 * A slot for a single store within a RunePlugin.
 */
export interface StoreSlot {
  /** slot id, used as key in STORE_REGISTRY and stores Map */
  id: string;
  /** from RUNE_LAB_CONTEXT or consumer-defined symbol */
  contextKey: symbol;
  /** existing type: (config, driver, stores) => Store | null */
  factory: StoreFactory;
  /** null return from factory means skip, not error */
  optional?: boolean;
  /** other slot ids that must initialize first */
  dependsOn?: string[];
  /** skip persistence driver injection for this slot */
  noPersistence?: boolean;
}

/**
 * A RunePlugin is a collection of stores and overlays.
 */
export interface RunePlugin {
  /** dot-namespaced: "rune-lab.layout" */
  id: string;
  /** one or more store slots */
  stores: StoreSlot[];
  /** Svelte components, no required props */
  overlays?: Component<Record<never, never>>[];
}

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
const STORE_REGISTRY: Map<string, StoreRegistryEntry> = new Map<
  string,
  StoreRegistryEntry
>();

/**
 * Register a store entry in the global registry.
 * Must be called before RuneProvider mounts for the store to be auto-wired.
 *
 * @param entry - Store registry entry with key, factory, and options.
 * @throws Error if a store with the same key is already registered.
 */
export function registerStore<TConfig = unknown, TStore = unknown>(
  entry: StoreRegistryEntry<TConfig, TStore>,
): void {
  if (STORE_REGISTRY.has(entry.key)) {
    console.warn(
      `[StoreRegistry] Overwriting existing store registration for key "${entry.key}"`,
    );
  }
  STORE_REGISTRY.set(entry.key, entry as StoreRegistryEntry);
}

/**
 * Define a Rune plugin and register its stores.
 */
export function defineRune(plugin: RunePlugin): RunePlugin {
  for (const slot of plugin.stores) {
    registerStore({
      key: slot.id,
      contextKey: slot.contextKey,
      pluginId: plugin.id,
      factory: slot.factory,
      optional: slot.optional,
      dependsOn: slot.dependsOn,
      noPersistence: slot.noPersistence,
    });
  }
  return plugin;
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
 * Initialize all registered stores using the provided plugins, config, and driver.
 * Resolves dependencies via topological sort and returns a map of key → store instance.
 *
 * @param _plugins - The list of active RunePlugins (unused but kept for API stability)
 * @param config - The RuneLabConfig (Record<string, unknown>)
 * @param driver - The resolved PersistenceDriver
 * @returns Map of store key → created store instance
 */
export function initializeStores(
  _plugins: unknown[], // RunePlugin[] - avoid circular import if possible
  config: Record<string, unknown>,
  driver: PersistenceDriver,
): Map<string, unknown> {
  const entries = Array.from(STORE_REGISTRY.values());
  const sorted = topologicalSort(entries);
  const stores = new Map<string, unknown>();

  for (const entry of sorted) {
    // Extract plugin-specific config slice if pluginId is present
    // Fallback to root config for backward compat with top-level props
    const pluginConfig = entry.pluginId && config[entry.pluginId]
      ? (config[entry.pluginId] as Record<string, unknown>)
      : config;

    // Skip conditional stores when their config key is absent
    if (entry.conditional && !(entry.conditional in pluginConfig)) {
      continue;
    }

    const store = entry.factory(pluginConfig, driver, stores);

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
