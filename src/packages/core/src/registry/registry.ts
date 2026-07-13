import { Context, Layer } from "effect";
import type { StoreRegistryEntry } from "../plugin/manifest.ts";

export class RegistryService extends Context.Tag(
  "@rune-lab/core/RegistryService",
)<
  RegistryService,
  {
    register(entry: StoreRegistryEntry): void;
    get(id: string): StoreRegistryEntry | undefined;
    entries(): StoreRegistryEntry[];
    clear(): void;
  }
>() {}

export const makeRegistryLayer = (): Layer.Layer<
  RegistryService,
  never,
  never
> => {
  const stores = new Map<string, StoreRegistryEntry>();
  return Layer.succeed(RegistryService, {
    register(entry) {
      stores.set(entry.id, entry);
    },
    get(id) {
      return stores.get(id);
    },
    entries() {
      return Array.from(stores.values());
    },
    clear() {
      stores.clear();
    },
  });
};

// For backward compatibility (global registry):
const GLOBAL_STORES = new Map<string, StoreRegistryEntry>();

export function registerStore<TConfig = unknown, TStore = unknown>(
  entry: StoreRegistryEntry<TConfig, TStore>,
): void {
  GLOBAL_STORES.set(entry.id, entry as StoreRegistryEntry);
}

export function getRegisteredStore(
  key: string,
): StoreRegistryEntry | undefined {
  return GLOBAL_STORES.get(key);
}

export function getAllRegisteredStores(): Map<string, StoreRegistryEntry> {
  return GLOBAL_STORES;
}

export function unregisterStore(key: string): boolean {
  return GLOBAL_STORES.delete(key);
}

export function clearRegistry(): void {
  GLOBAL_STORES.clear();
}
