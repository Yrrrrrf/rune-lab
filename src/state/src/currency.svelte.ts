import {
  type ConfigStore,
  createConfigStore,
} from "./createConfigStore.svelte.ts";
import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "./context.ts";
import { type DineroCurrency, registerCurrency } from "@internal/core";

/**
 * Currency configuration
 * Based on ISO 4217 currency codes
 */
export interface Currency {
  code: string; // ISO 4217 code (e.g., "USD", "EUR", "MXN")
  symbol: string; // Currency symbol (e.g., "$", "€", "₹")
  decimals: number; // Number of decimal places (usually 2)
}

/**
 * Helper to build a minimal Dinero definition from Currency metadata.
 * Assumes base 10 (standard decimal) for auto-registration.
 */
function buildDineroDef(meta: Currency) {
  return {
    code: meta.code,
    base: 10,
    exponent: meta.decimals,
  };
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
import { resolveDriver } from "./persistence/provider.ts";
import type { ExchangeRateStore } from "./exchange-rate.svelte.ts";

export interface CurrencyStoreOptions {
  driver?: PersistenceDriver | (() => PersistenceDriver | undefined);
  /** Additional custom currencies to append to the built-in set */
  customCurrencies?: Currency[];
  /** Default currency code if no persisted value exists */
  defaultCurrency?: string;
  /** Wired exchange rate store for conversions */
  exchangeRateStore?: ExchangeRateStore;
}

export function createCurrencyStore(
  driverOrOptions?:
    | PersistenceDriver
    | (() => PersistenceDriver | undefined)
    | CurrencyStoreOptions,
) {
  // Normalize overloaded argument
  const opts: CurrencyStoreOptions =
    driverOrOptions && typeof driverOrOptions === "object" &&
      "driver" in driverOrOptions
      ? driverOrOptions
      : {
        driver: driverOrOptions as
          | PersistenceDriver
          | (() => PersistenceDriver | undefined)
          | undefined,
      };

  const resolvedDriver = resolveDriver(opts.driver);

  const store = createConfigStore<Currency>({
    items: CURRENCIES,
    storageKey: "currency",
    displayName: "Currency",
    idKey: "code",
    icon: "💰",
    driver: resolvedDriver,
  });

  const exchangeRateStore = opts.exchangeRateStore;

  /**
   * Extension: Atomic currency registration.
   * Updates both the Dinero registry (core) and the reactive store (UI).
   *
   * @remarks Custom currencies with non-decimal base systems must use
   * registerCurrency() from @internal/core explicitly before addItems().
   */
  function addCurrency(meta: Currency, dineroDef?: unknown) {
    const def = dineroDef || buildDineroDef(meta);
    registerCurrency(meta.code, def as DineroCurrency<number>);
    store.addItems([meta]);
  }

  /**
   * Converts an amount from one currency to another.
   * Defaults to converting to the current store currency.
   */
  function convertAmount(
    amount: number,
    fromCode: string,
    toCode?: string,
  ): number {
    const target = toCode ?? String((store as ConfigStore<Currency>).current);
    if (fromCode === target) return amount;
    if (!exchangeRateStore || !exchangeRateStore.hasRates) return amount;

    return exchangeRateStore.convertAmount(amount, fromCode, target);
  }

  // Append and auto-register custom currencies if provided
  if (opts.customCurrencies?.length) {
    for (const c of opts.customCurrencies) {
      registerCurrency(c.code, buildDineroDef(c) as DineroCurrency<number>);
    }
    store.addItems(opts.customCurrencies);
  }

  // Set default currency if provided and no persisted value found
  if (!resolvedDriver?.get("currency") && opts.defaultCurrency) {
    if (store.get(opts.defaultCurrency as never)) {
      store.set(opts.defaultCurrency as never);
    }
  }

  // Explicitly attach method to ensure prototype is preserved and method is available
  // across different build environments.
  Object.defineProperties(store, {
    addCurrency: { value: addCurrency },
    convertAmount: { value: convertAmount },
    canConvert: { get: () => !!exchangeRateStore?.hasRates },
  });

  return store as ReturnType<typeof createConfigStore<Currency>> & {
    addCurrency: typeof addCurrency;
    convertAmount: typeof convertAmount;
    readonly canConvert: boolean;
  };
}

export type CurrencyStore = ReturnType<typeof createCurrencyStore>;

export function getCurrencyStore() {
  return getContext<CurrencyStore>(RUNE_LAB_CONTEXT.currency);
}
