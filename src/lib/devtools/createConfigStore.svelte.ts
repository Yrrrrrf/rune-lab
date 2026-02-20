// client/sdk/devtools/src/patterns/createConfigStore.svelte.ts

export type ConfigStore<T extends ConfigItem> = {
  current: T[keyof T];
  available: T[];
  set: (id: T[keyof T]) => void;
  get: (id: T[keyof T]) => T | undefined;
  getProp: <K extends keyof T>(prop: K, id?: T[keyof T]) => T[K] | undefined;
};


/**
 * Generic configuration store factory
 * Creates type-safe stores for theme, language, currency, etc.
 * with validation, persistence, and utilities
 */

interface ConfigItem {
  [key: string]: any;
}

interface ConfigStoreOptions<T extends ConfigItem> {
  /** Array of available items */
  items: readonly T[];
  /** LocalStorage key */
  storageKey: string;
  /** Display name for logging (e.g., "Theme", "Language") */
  displayName: string;
  /** Key to use as identifier (e.g., "code", "name") */
  idKey: keyof T;
  /** Icon for logs */
  icon?: string;
}

/**
 * Creates a reactive configuration store with persistence
 */
export function createConfigStore<T extends ConfigItem>(
  options: ConfigStoreOptions<T>,
) {
  const { items, storageKey, displayName, idKey, icon = "⚙️" } = options;

  class ConfigStore {
    current: T[typeof idKey] = $state(
      items[0]?.[idKey] ?? ("" as T[typeof idKey]),
    );
    available: T[] = $state([...items] as T[]);

    constructor() {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(storageKey);
        // Only load saved if it actually exists in our available items
        if (saved && this.get(saved as T[typeof idKey])) {
          this.current = saved as T[typeof idKey];
        }
      }

      if (import.meta.env?.DEV) {
        console.log(`${icon} ${displayName} configured:`, {
          current: this.current,
        });
      }
    }

    /**
     * Set current item with validation
     */
    set(id: T[typeof idKey]): void {
      const item = this.get(id);
      if (!item) {
        console.warn(`${displayName} "${id}" not found`);
        return;
      }
      this.current = id;
      localStorage.setItem(storageKey, String(id));
    }

    /**
     * Get item by id
     */
    get(id: T[typeof idKey]): T | undefined {
      return this.available.find((item) => item[idKey] === id);
    }

    /**
     * Get property from current or specified item
     */
    getProp<K extends keyof T>(
      prop: K,
      id?: T[typeof idKey],
    ): T[K] | undefined {
      const targetId = id ?? this.current;
      return this.get(targetId)?.[prop];
    }
  }

  return new ConfigStore();
}

