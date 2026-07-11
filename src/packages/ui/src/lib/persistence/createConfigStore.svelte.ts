import type { PersistenceDriver } from "@rune-lab/core";
import { createInMemoryDriver } from "./drivers.ts";
import { DEV } from "esm-env";

export type ConfigStore<T, K extends keyof T = keyof T> = {
  current: T[K];
  available: T[];
  set(id: T[K]): void;
  get(id: T[K]): T | undefined;
  getProp<P extends keyof T>(prop: P, id?: T[K]): T[P] | undefined;
  addItems(newItems: T[]): void;
  /**
   * Register a callback to fire when the current item changes.
   * Returns an unsubscribe function.
   */
  onChange: (cb: (newId: T[K], oldId: T[K]) => void) => () => void;
  /**
   * Inject (or replace) the persistence driver at runtime.
   * Call this inside your plugin factory so the real driver
   * (e.g. localStorageDriver from RuneProvider) is used instead
   * of the default in-memory fallback that was set at module-load time.
   * Also re-reads any value already persisted under storageKey.
   */
  setDriver: (driver: PersistenceDriver) => void;
};

export interface ConfigStoreOptions<T, K extends keyof T = keyof T> {
  /** Array of available items */
  items: readonly T[];
  /** Storage key used by the persistence driver */
  storageKey: string;
  /** Display name for logging (e.g., "Config", "Language") */
  displayName: string;
  /** Key to use as identifier (e.g., "code", "name") */
  idKey: K;
  /** Icon for logs */
  icon?: string;
  /** Persistence driver */
  driver?: PersistenceDriver;
}

/**
 * Internal class implementation for configuration stores.
 * Stable class definition avoids potential issues with multiple definitions in SSR.
 */
class ConfigStoreImpl<T, K extends keyof T> {
  current: T[K] = $state(null!);
  available: T[] = $state([]);

  #options: ConfigStoreOptions<T, K>;
  #driver: PersistenceDriver;
  #callbacks: Set<(newId: T[K], oldId: T[K]) => void> = new Set();

  constructor(options: ConfigStoreOptions<T, K>) {
    this.#options = options;
    const { items, idKey, storageKey, driver = createInMemoryDriver() } =
      options;
    this.#driver = driver;

    this.available = [...items] as T[];
    this.current = items[0][idKey];

    const saved = this.#driver.get(storageKey);
    // Only load saved if it actually exists in our available items
    if (saved && this.get(saved as T[K])) {
      this.current = saved as T[K];
    }

    // Only log here if we were initialized with a real driver (not the default in-memory)
    if (DEV && options.driver) {
      this.#logConfig();
    }
  }

  #logConfig(): void {
    console.log(
      `${this.#options.icon ?? "⚙️"} ${this.#options.displayName} configured:`,
      {
        current: this.current,
      },
    );
  }

  /**
   * Replace the persistence driver and immediately re-read any saved value.
   *
   * Singletons are constructed at module-load time (before RuneProvider
   * mounts), so they default to createInMemoryDriver(). Call this inside
   * your plugin factory to swap in the real driver (e.g. localStorageDriver)
   * so that all subsequent .set() calls are persisted correctly.
   */
  setDriver(driver: PersistenceDriver): void {
    this.#driver = driver;
    // Re-read persisted value now that we have a real driver
    const saved = driver.get(this.#options.storageKey);
    if (saved && this.get(saved as T[K])) {
      this.current = saved as T[K];
    }

    if (DEV) {
      this.#logConfig();
    }
  }

  /**
   * Set current item with validation
   */
  set(id: T[K]): void {
    const item = this.get(id);
    if (!item) {
      console.warn(`${this.#options.displayName} "${id}" not found`);
      return;
    }
    const old = this.current;
    this.current = id;
    this.#driver.set(this.#options.storageKey, String(id));

    // Call callbacks after state update and persistence
    this.#callbacks.forEach((cb) => {
      try {
        cb(id, old);
      } catch (err) {
        if (DEV) {
          console.error(
            `[rune-lab] Error in ${this.#options.displayName} onChange callback:`,
            err,
          );
        }
      }
    });
  }

  /**
   * Register a change callback
   */
  onChange(cb: (newId: T[K], oldId: T[K]) => void): () => void {
    this.#callbacks.add(cb);
    return () => this.#callbacks.delete(cb);
  }

  /**
   * Get item by id
   */
  get(id: T[K]): T | undefined {
    const idKey = this.#options.idKey;
    return this.available.find(
      (item: T) => item[idKey] === id,
    );
  }

  /**
   * Get property from current or specified item
   */
  getProp<P extends keyof T>(prop: P, id?: T[K]): T[P] | undefined {
    const targetId = id ?? this.current;
    return this.get(targetId)?.[prop];
  }

  /**
   * Append additional items (deduplicates by idKey)
   */
  addItems(newItems: T[]): void {
    const idKey = this.#options.idKey;
    for (const item of newItems) {
      if (!this.get(item[idKey] as T[K])) {
        this.available.push(item);
      }
    }
  }
}

/**
 * Creates a reactive configuration store with persistence
 */
export function createConfigStore<T, K extends keyof T>(
  options: ConfigStoreOptions<T, K>,
): ConfigStore<T, K> {
  return new ConfigStoreImpl(options) as unknown as ConfigStore<T, K>;
}
