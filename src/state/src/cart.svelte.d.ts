import type { PersistenceDriver } from "@rune-lab/core";
/**
 * Configuration for creating a CartStore
 */
export interface CartStoreConfig<T> {
  /** Extract a unique identifier from an item */
  idExtractor: (item: T) => string;
  /** Extract the price (in minor units / cents) from an item */
  priceExtractor: (item: T) => number;
  /** Optional persistence driver for cart recovery */
  driver?: PersistenceDriver;
  /** Storage key for persistence */
  storageKey?: string;
}
export interface CartEntry<T> {
  item: T;
  qty: number;
}
/**
 * Generic cart store factory.
 * Works with any item type via extractors.
 *
 * **Note**: Consumers must call `setContext(RUNE_LAB_CONTEXT.cart, store)` manually
 * since CartStore is app-specific (needs `idExtractor` and `priceExtractor`).
 * RuneProvider can optionally wire it via `config.cart`.
 *
 * Usage:
 *   const cart = createCartStore<Property>({
 *     idExtractor: (p) => p.id,
 *     priceExtractor: (p) => p.price,
 *   });
 *   cart.add(someProperty);
 *   cart.totalPrice; // sum of all items * qty in minor units
 */
export declare function createCartStore<T>(config: CartStoreConfig<T>): {
  /** All cart entries */
  readonly items: CartEntry<T>[];
  /** Total number of items (sum of quantities) */
  readonly totalItems: number;
  /** Total price in minor units */
  readonly totalPrice: number;
  /** Whether the cart is empty */
  readonly isEmpty: boolean;
  /** Add an item (or increment quantity if already present) */
  add(item: T, qty?: number): void;
  /** Remove an item entirely */
  remove(id: string): void;
  /** Update the quantity of an item (removes if qty ≤ 0) */
  updateQty(id: string, qty: number): void;
  /** Clear all items */
  clear(): void;
  /** Check if an item is in the cart */
  has(id: string): boolean;
  /** Get a specific entry by ID */
  getEntry(id: string): CartEntry<T> | undefined;
};
/** Return type of createCartStore for context typing */
export type CartStore<T = unknown> = ReturnType<typeof createCartStore<T>>;
/**
 * Get CartStore from Svelte context.
 * Only works if the consuming app has called setContext(RUNE_LAB_CONTEXT.cart, store)
 * or passed a cart config to RuneProvider.
 */
export declare function getCartStore<T = unknown>(): CartStore<T>;
