import {
  type ConfigStore,
  createConfigStore,
} from "./createConfigStore.svelte";
import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "./context";

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
  { code: "GBP", symbol: "£", decimals: 2 },
  { code: "MXN", symbol: "$", decimals: 2 },
  { code: "CAD", symbol: "C$", decimals: 2 },
  { code: "BRL", symbol: "R$", decimals: 2 },
  { code: "INR", symbol: "₹", decimals: 2 },
  { code: "CNY", symbol: "¥", decimals: 2 },
  { code: "JPY", symbol: "¥", decimals: 0 },
  { code: "KRW", symbol: "₩", decimals: 0 },
  { code: "AED", symbol: "د.إ", decimals: 2 },
] as const;

import type { PersistenceDriver } from "@internal/core";

export interface CurrencyStoreOptions {
  driver?: PersistenceDriver | (() => PersistenceDriver | undefined);
  /** Additional custom currencies to append to the built-in set */
  customCurrencies?: Currency[];
  /** Default currency code if no persisted value exists */
  defaultCurrency?: string;
}

export function createCurrencyStore(
  driverOrOptions?:
    | PersistenceDriver
    | (() => PersistenceDriver | undefined)
    | CurrencyStoreOptions,
) {
  // Normalize overloaded argument
  const opts: CurrencyStoreOptions =
    driverOrOptions && typeof driverOrOptions === "object" && "driver" in driverOrOptions
      ? driverOrOptions
      : { driver: driverOrOptions as PersistenceDriver | (() => PersistenceDriver | undefined) | undefined };

  const resolvedDriver =
    typeof opts.driver === "function" ? opts.driver() : opts.driver;

  const store = createConfigStore({
    items: CURRENCIES,
    storageKey: "currency",
    displayName: "Currency",
    idKey: "code",
    icon: "💰",
    driver: resolvedDriver,
  });

  // Append custom currencies if provided
  if (opts.customCurrencies?.length) {
    store.addItems(opts.customCurrencies);
  }

  // Set default currency if provided and no persisted value found
  if (!resolvedDriver?.get("currency") && opts.defaultCurrency) {
    if (store.get(opts.defaultCurrency as any)) {
      store.set(opts.defaultCurrency as any);
    }
  }

  return store;
}

export function getCurrencyStore() {
  return getContext<ConfigStore<Currency>>(RUNE_LAB_CONTEXT.currency);
}
