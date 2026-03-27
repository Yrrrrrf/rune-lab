// src/lib/persistence/types.ts

/**
 * Synchronous persistence driver interface for Svelte stores
 */
export interface PersistenceDriver {
  /**
   * Get a value by key. Should return null if not found.
   */
  get(key: string): string | null;
  /**
   * Set a value by key.
   */
  set(key: string, value: string): void;
  /**
   * Remove a value by key.
   */
  remove(key: string): void;
}
