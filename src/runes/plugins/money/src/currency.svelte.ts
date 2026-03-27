import {
  type ConfigStore,
  createConfigStore,
  getCurrencyStore,
} from "@rune-lab/kernel";
import type { Currency } from "@rune-lab/kernel";
import { type DineroCurrency, registerCurrency } from "@rune-lab/money";
import type { ExchangeRateStore } from "./exchange-rate.svelte.ts";

export type { Currency };

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

const baseStore: ConfigStore<Currency> = createConfigStore<Currency>({
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
  const target = toCode ?? String((baseStore as ConfigStore<Currency>).current);
  if (fromCode === target) return amount;
  if (!_exchangeRateStore || !_exchangeRateStore.hasRates) return amount;

  return _exchangeRateStore.convertAmount(amount, fromCode, target);
}

export const currencyStore: ConfigStore<Currency> & {
  addCurrency: typeof addCurrency;
  convertAmount: typeof convertAmount;
  readonly canConvert: boolean;
} = Object.assign(baseStore, {
  addCurrency,
  convertAmount,
  get canConvert() {
    return !!_exchangeRateStore?.hasRates;
  },
});

export type CurrencyStore = typeof currencyStore;

export { getCurrencyStore };
