import type { PersistenceDriver } from "@rune-lab/kernel";
import { createInMemoryDriver } from "./drivers.ts";
import { DEV } from "esm-env";

export type ConfigStore<T = unknown> = {
  current: unknown;
  available: T[];
  set: (id: unknown) => void;
  get: (id: unknown) => T | undefined;
  getProp: <K extends keyof T>(prop: K, id?: unknown) => T[K] | undefined;
  /** Append additional items (e.g. custom themes/currencies from the consuming app) */
  addItems: (newItems: T[]) => void;
};

export interface ConfigStoreOptions<T = unknown> {
  /** Array of available items */
  items: readonly T[];
  /** Storage key used by the persistence driver */
  storageKey: string;
  /** Display name for logging (e.g., "Theme", "Language") */
  displayName: string;
  /** Key to use as identifier (e.g., "code", "name") */
  idKey: keyof T;
  /** Icon for logs */
  icon?: string;
  /** Persistence driver */
  driver?: PersistenceDriver;
}

/**
 * Internal class implementation for configuration stores.
 * Stable class definition avoids potential issues with multiple definitions in SSR.
 */
class ConfigStoreImpl<T = unknown> {
  current: unknown = $state(null);
  available: T[] = $state([]);

  #options: ConfigStoreOptions<T>;
  #driver: PersistenceDriver;

  constructor(options: ConfigStoreOptions<T>) {
    this.#options = options;
    const { items, idKey, storageKey, driver = createInMemoryDriver() } =
      options;
    this.#driver = driver;

    this.available = [...items] as T[];
    this.current = items[0]?.[idKey] ?? "";

    const saved = this.#driver.get(storageKey);
    // Only load saved if it actually exists in our available items
    if (saved && this.get(saved)) {
      this.current = saved;
    }

    if (DEV) {
      console.log(
        `${options.icon ?? "⚙️"} ${options.displayName} configured:`,
        {
          current: this.current,
        },
      );
    }
  }

  /**
   * Set current item with validation
   */
  set(id: unknown): void {
    const item = this.get(id);
    if (!item) {
      console.warn(`${this.#options.displayName} "${id}" not found`);
      return;
    }
    this.current = id;
    this.#driver.set(this.#options.storageKey, String(id));
  }

  /**
   * Get item by id
   */
  get(id: unknown): T | undefined {
    const idKey = this.#options.idKey;
    return this.available.find((item: T) =>
      (item as Record<string, unknown>)[idKey as string] === id
    );
  }

  /**
   * Get property from current or specified item
   */
  getProp<K extends keyof T>(prop: K, id?: unknown): T[K] | undefined {
    const targetId = id ?? this.current;
    return (this.get(targetId) as Record<string, unknown> | undefined)
      ?.[prop as string] as T[K] | undefined;
  }

  /**
   * Append additional items (deduplicates by idKey)
   */
  addItems(newItems: T[]): void {
    const idKey = this.#options.idKey;
    for (const item of newItems) {
      if (!this.get((item as Record<string, unknown>)[idKey as string])) {
        this.available.push(item);
      }
    }
  }
}

/**
 * Creates a reactive configuration store with persistence
 */
export function createConfigStore<T = unknown>(
  options: ConfigStoreOptions<T>,
): ConfigStore<T> {
  return new ConfigStoreImpl(options) as unknown as ConfigStore<T>;
}
