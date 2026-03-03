// sdk/state/src/cart.svelte.ts
// Generic cart store factory — business-agnostic add/remove/total pattern.

import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "./context";
import type { PersistenceDriver } from "@internal/core";
import { DEV } from "esm-env";

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
export function createCartStore<T>(config: CartStoreConfig<T>) {
    const {
        idExtractor,
        priceExtractor,
        driver,
        storageKey = "cart",
    } = config;

    // Internal entries store — using a plain array for correct serialization
    let _entries = $state<CartEntry<T>[]>([]);

    /** Lookup by ID */
    function _findIndex(id: string): number {
        return _entries.findIndex((e) => idExtractor(e.item) === id);
    }

    /** @internal Persist current state (Map serialized as Array) */
    function _persist(): void {
        if (!driver) return;
        try {
            const data = _entries.map((entry) => ({
                id: idExtractor(entry.item),
                qty: entry.qty,
            }));
            driver.set(storageKey, JSON.stringify(data));
        } catch {
            // Persistence is best-effort
        }
    }

    return {
        /** All cart entries */
        get items(): CartEntry<T>[] {
            return _entries;
        },

        /** Total number of items (sum of quantities) */
        get totalItems(): number {
            let total = 0;
            for (const entry of _entries) total += entry.qty;
            return total;
        },

        /** Total price in minor units */
        get totalPrice(): number {
            let total = 0;
            for (const entry of _entries) total += priceExtractor(entry.item) * entry.qty;
            return total;
        },

        /** Whether the cart is empty */
        get isEmpty(): boolean {
            return _entries.length === 0;
        },

        /** Add an item (or increment quantity if already present) */
        add(item: T, qty: number = 1): void {
            const id = idExtractor(item);
            const idx = _findIndex(id);
            if (idx >= 0) {
                _entries[idx] = { ..._entries[idx], qty: _entries[idx].qty + qty };
            } else {
                _entries = [..._entries, { item, qty }];
            }
            _persist();
            if (DEV) console.log(`🛒 Added ${id} (qty: ${qty})`);
        },

        /** Remove an item entirely */
        remove(id: string): void {
            _entries = _entries.filter((e) => idExtractor(e.item) !== id);
            _persist();
        },

        /** Update the quantity of an item (removes if qty ≤ 0) */
        updateQty(id: string, qty: number): void {
            if (qty <= 0) {
                this.remove(id);
                return;
            }
            const idx = _findIndex(id);
            if (idx >= 0) {
                _entries[idx] = { ..._entries[idx], qty };
                _persist();
            }
        },

        /** Clear all items */
        clear(): void {
            _entries = [];
            _persist();
        },

        /** Check if an item is in the cart */
        has(id: string): boolean {
            return _findIndex(id) >= 0;
        },

        /** Get a specific entry by ID */
        getEntry(id: string): CartEntry<T> | undefined {
            return _entries.find((e) => idExtractor(e.item) === id);
        },
    };
}

/** Return type of createCartStore for context typing */
export type CartStore<T = unknown> = ReturnType<typeof createCartStore<T>>;

/**
 * Get CartStore from Svelte context.
 * Only works if the consuming app has called setContext(RUNE_LAB_CONTEXT.cart, store)
 * or passed a cart config to RuneProvider.
 */
export function getCartStore<T = unknown>(): CartStore<T> {
    return getContext<CartStore<T>>(RUNE_LAB_CONTEXT.cart);
}
