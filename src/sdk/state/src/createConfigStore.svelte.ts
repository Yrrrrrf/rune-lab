import { type PersistenceDriver } from "@internal/core";
import { createInMemoryDriver } from "./persistence/drivers.ts";
import { DEV } from "esm-env";

export type ConfigStore<T extends object> = {
  current: T[keyof T];
  available: T[];
  set: (id: T[keyof T]) => void;
  get: (id: T[keyof T]) => T | undefined;
  getProp: <K extends keyof T>(prop: K, id?: T[keyof T]) => T[K] | undefined;
  /** Append additional items (e.g. custom themes/currencies from the consuming app) */
  addItems: (newItems: T[]) => void;
};

export interface ConfigStoreOptions<T extends object> {
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
class ConfigStoreImpl<T extends object> {
  current: T[keyof T] = $state(null as unknown as T[keyof T]);
  available: T[] = $state([]);

  #options: ConfigStoreOptions<T>;
  #driver: PersistenceDriver;

  constructor(options: ConfigStoreOptions<T>) {
    this.#options = options;
    const { items, idKey, storageKey, driver = createInMemoryDriver() } =
      options;
    this.#driver = driver;

    this.available = [...items] as T[];
    this.current = items[0]?.[idKey] ?? ("" as T[typeof idKey]);

    const saved = this.#driver.get(storageKey);
    // Only load saved if it actually exists in our available items
    if (saved && this.get(saved as T[keyof T])) {
      this.current = saved as T[keyof T];
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
  set(id: T[keyof T]): void {
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
  get(id: T[keyof T]): T | undefined {
    const idKey = this.#options.idKey;
    return this.available.find((item) => item[idKey] === id);
  }

  /**
   * Get property from current or specified item
   */
  getProp<K extends keyof T>(
    prop: K,
    id?: T[keyof T],
  ): T[K] | undefined {
    const targetId = id ?? this.current;
    return this.get(targetId)?.[prop];
  }

  /**
   * Append additional items (deduplicates by idKey)
   */
  addItems(newItems: T[]): void {
    const idKey = this.#options.idKey;
    for (const item of newItems) {
      if (!this.get(item[idKey])) {
        this.available.push(item);
      }
    }
  }
}

/**
 * Creates a reactive configuration store with persistence
 */
export function createConfigStore<T extends object>(
  options: ConfigStoreOptions<T>,
): ConfigStore<T> {
  return new ConfigStoreImpl(options) as unknown as ConfigStore<T>;
}
