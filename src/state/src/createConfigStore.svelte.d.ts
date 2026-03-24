import type { PersistenceDriver } from "@internal/core";
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
 * Creates a reactive configuration store with persistence
 */
export declare function createConfigStore<T extends object>(
  options: ConfigStoreOptions<T>,
): ConfigStore<T>;
