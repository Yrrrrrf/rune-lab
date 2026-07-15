import { createInMemoryDriver } from "../persistence/memory.ts";
import type { PersistenceDriver } from "../ports/persistence.ts";

export type ConfigStore<T, K extends keyof T = keyof T> = {
  current: T[K];
  available: T[];
  set(id: T[K]): void;
  get(id: T[K]): T | undefined;
  getProp<P extends keyof T>(prop: P, id?: T[K]): T[P] | undefined;
  addItems(newItems: T[]): void;
  onChange: (cb: (newId: T[K], oldId: T[K]) => void) => () => void;
  setDriver: (driver: PersistenceDriver) => void;
};

export interface ConfigStoreOptions<T, K extends keyof T = keyof T> {
  items: readonly T[];
  storageKey: string;
  displayName: string;
  idKey: K;
  icon?: string;
  driver?: PersistenceDriver;
}

export class ConfigStoreImpl<T, K extends keyof T> {
  current: T[K] = null!;
  available: T[] = [];

  #options: ConfigStoreOptions<T, K>;
  #driver: PersistenceDriver;
  #callbacks: Set<(newId: T[K], oldId: T[K]) => void> = new Set();

  constructor(options: ConfigStoreOptions<T, K>) {
    this.#options = options;
    const {
      items,
      idKey,
      storageKey,
      driver = createInMemoryDriver(),
    } = options;
    this.#driver = driver;

    this.available = [...items] as T[];
    this.current = items[0][idKey];

    const saved = this.#driver.get(storageKey);
    // Handle either synchronous or Promise response from driver
    if (saved instanceof Promise) {
      saved
        .then((val) => {
          if (val && this.get(val as T[K])) {
            const old = this.current;
            this.current = val as T[K];
            this.#notify(val as T[K], old);
          }
        })
        .catch(() => {});
    } else if (saved && this.get(saved as T[K])) {
      this.current = saved as T[K];
    }
  }

  setDriver(driver: PersistenceDriver): void {
    this.#driver = driver;
    const saved = driver.get(this.#options.storageKey);
    if (saved instanceof Promise) {
      saved
        .then((val) => {
          if (val && this.get(val as T[K])) {
            const old = this.current;
            this.current = val as T[K];
            this.#notify(val as T[K], old);
          }
        })
        .catch(() => {});
    } else if (saved && this.get(saved as T[K])) {
      this.current = saved as T[K];
    }
  }

  set(id: T[K]): void {
    const item = this.get(id);
    if (!item) {
      console.warn(`${this.#options.displayName} "${id}" not found`);
      return;
    }
    const old = this.current;
    this.current = id;
    this.#driver.set(this.#options.storageKey, String(id));
    this.#notify(id, old);
  }

  #notify(newId: T[K], oldId: T[K]): void {
    this.#callbacks.forEach((cb) => {
      try {
        cb(newId, oldId);
      } catch (err) {
        console.error(
          `[rune-lab/core] Error in ${this.#options.displayName} onChange callback:`,
          err,
        );
      }
    });
  }

  onChange(cb: (newId: T[K], oldId: T[K]) => void): () => void {
    this.#callbacks.add(cb);
    return () => this.#callbacks.delete(cb);
  }

  get(id: T[K]): T | undefined {
    const idKey = this.#options.idKey;
    return this.available.find((item: T) => item[idKey] === id);
  }

  getProp<P extends keyof T>(prop: P, id?: T[K]): T[P] | undefined {
    const targetId = id ?? this.current;
    return this.get(targetId)?.[prop];
  }

  addItems(newItems: T[]): void {
    const idKey = this.#options.idKey;
    for (const item of newItems) {
      if (!this.get(item[idKey] as T[K])) {
        this.available.push(item);
      }
    }
  }
}

export function createConfigStore<T, K extends keyof T>(
  options: ConfigStoreOptions<T, K>,
): ConfigStore<T, K> {
  return new ConfigStoreImpl(options) as unknown as ConfigStore<T, K>;
}
