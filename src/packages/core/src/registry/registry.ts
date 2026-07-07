import type { StoreRegistryEntry } from "../plugin/manifest.ts";

const STORE_REGISTRY = new Map<string, StoreRegistryEntry>();

export function registerStore<TConfig = unknown, TStore = unknown>(
  entry: StoreRegistryEntry<TConfig, TStore>,
): void {
  if (STORE_REGISTRY.has(entry.id)) {
    console.warn(
      `[StoreRegistry] Overwriting existing store registration for id "${entry.id}"`,
    );
  }
  STORE_REGISTRY.set(entry.id, entry as StoreRegistryEntry);
}

export function getRegisteredStore(
  key: string,
): StoreRegistryEntry | undefined {
  return STORE_REGISTRY.get(key);
}

export function getAllRegisteredStores(): Map<string, StoreRegistryEntry> {
  return STORE_REGISTRY;
}

export function unregisterStore(key: string): boolean {
  return STORE_REGISTRY.delete(key);
}

export function clearRegistry(): void {
  STORE_REGISTRY.clear();
}

export function topologicalSort(
  entries: StoreRegistryEntry[],
): StoreRegistryEntry[] {
  const sorted: StoreRegistryEntry[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>(); // cycle detection

  const entryMap = new Map(entries.map((e) => [e.id, e]));

  function visit(entry: StoreRegistryEntry) {
    if (visited.has(entry.id)) return;
    if (visiting.has(entry.id)) {
      throw new Error(
        `[StoreRegistry] Circular dependency detected involving "${entry.id}"`,
      );
    }

    visiting.add(entry.id);

    for (const depKey of entry.dependsOn ?? []) {
      const dep = entryMap.get(depKey);
      if (dep) visit(dep);
    }

    visiting.delete(entry.id);
    visited.add(entry.id);
    sorted.push(entry);
  }

  for (const entry of entries) {
    visit(entry);
  }

  return sorted;
}

export { STORE_REGISTRY };
