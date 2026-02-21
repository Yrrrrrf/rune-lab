import {
  type ConfigStore,
  createConfigStore,
} from "$lib/devtools/createConfigStore.svelte";
import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "$lib/context";

/**
 * Currency configuration
 * Based on ISO 4217 currency codes
 */
export interface Currency {
  code: string; // ISO 4217 code (e.g., "USD", "EUR", "MXN")
  symbol: string; // Currency symbol (e.g., "$", "€", "₹")
  decimals: number; // Number of decimal places (usually 2)
}

const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", decimals: 2 },
  { code: "EUR", symbol: "€", decimals: 2 },
  { code: "MXN", symbol: "$", decimals: 2 },
  { code: "CNY", symbol: "¥", decimals: 2 },
  { code: "JPY", symbol: "¥", decimals: 0 },
  { code: "KRW", symbol: "₩", decimals: 0 },
  { code: "AED", symbol: "د.إ", decimals: 2 },
] as const;

import type { PersistenceDriver } from "$lib/persistence/types";

export function createCurrencyStore(
  driver?: PersistenceDriver | (() => PersistenceDriver | undefined),
) {
  return createConfigStore({
    items: CURRENCIES,
    storageKey: "currency",
    displayName: "Currency",
    idKey: "code",
    icon: "💰",
    driver: typeof driver === "function" ? driver() : driver,
  });
}

export function getCurrencyStore() {
  return getContext<ConfigStore<Currency>>(RUNE_LAB_CONTEXT.currency);
}

// Usage:
// currencyStore.set("USD")
// currencyStore.getProp("symbol") // "$"
// currencyStore.getProp("decimals") // 2
