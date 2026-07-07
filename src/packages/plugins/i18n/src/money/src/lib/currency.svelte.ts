import { type ConfigStore, createConfigStore } from "@rune-lab/svelte";
import type { Currency } from "@rune-lab/svelte";
import { type DineroCurrency, registerCurrency } from "./money.ts";
import type { ExchangeRateStore } from "./exchange-rate.svelte.ts";
import { createMessageResolver } from "@rune-lab/svelte";
import { m } from "@rune-lab/svelte";

export type { Currency };

/**
 * Resolver to get the display name of a currency in the current locale
 */
export const getCurrencyName: (c: Currency) => string = createMessageResolver<
  Currency
>(m, {
  keyExtractor: (c) => c.code,
});

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

const CURRENCIES = [
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

const baseStore = createConfigStore<Currency, "code">({
  items: CURRENCIES,
  storageKey: "currency",
  displayName: "Currency",
  idKey: "code",
  icon: "💰",
});

// We hold a reference to exchangeRateStore if configured later
let _exchangeRateStore: ExchangeRateStore | undefined;
export function setExchangeRateStore(store: ExchangeRateStore) {
  _exchangeRateStore = store;
}

/**
 * Extension: Atomic currency registration.
 * Updates both the Dinero registry (core) and the reactive store (UI).
 *
 * @remarks Custom currencies with non-decimal base systems must use
 * registerCurrency() from @rune-lab/kernel explicitly before addItems().
 */
function addCurrency(meta: Currency, dineroDef?: unknown) {
  const def = dineroDef || buildDineroDef(meta);
  registerCurrency(meta.code, def as DineroCurrency<number>);
  baseStore.addItems([meta]);
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
  const target = toCode ?? String(baseStore.current);
  if (fromCode === target) return amount;
  if (!_exchangeRateStore || !_exchangeRateStore.hasRates) return amount;

  return _exchangeRateStore.convertAmount(amount, fromCode, target);
}

export const currencyStore = Object.assign(baseStore, {
  addCurrency,
  convertAmount,
}) as ConfigStore<Currency, "code"> & {
  addCurrency: typeof addCurrency;
  convertAmount: typeof convertAmount;
  readonly canConvert: boolean;
};

Object.defineProperty(currencyStore, "canConvert", {
  get() {
    return !!_exchangeRateStore?.hasRates;
  },
  enumerable: true,
  configurable: true,
});

export type CurrencyStore = typeof currencyStore;
