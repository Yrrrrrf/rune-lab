import { type ConfigStore, createConfigStore } from "rune-lab";
import type { SlotContext } from "rune-lab/core";
import { createMessageResolver } from "../../lang/message-resolver.ts";
import { m } from "../../lang/messages.ts";
import { type DineroCurrency, registerCurrency } from "../primitives/money.ts";
import type { Currency } from "../types.ts";
import type { ExchangeRateStore } from "./exchange-rate.svelte.ts";

export type { Currency };

/**
 * Resolver to get the display name of a currency in the current locale
 */
export const getCurrencyName: (c: Currency) => string = createMessageResolver<
  Currency
>(m, {
  keyExtractor: (c: Currency) => c.code,
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

export interface CurrencyConfig {
  readonly defaultCurrency?: string;
  readonly currencies?: readonly Currency[];
}

export type CurrencyStore = ConfigStore<Currency, "code"> & {
  addCurrency: (meta: Currency, dineroDef?: unknown) => void;
  convertAmount: (amount: number, fromCode: string, toCode?: string) => number;
  readonly canConvert: boolean;
};

export function createCurrencyStore(
  ctx: SlotContext<CurrencyConfig>,
  exchangeRateStore?: ExchangeRateStore,
): CurrencyStore {
  const baseStore = createConfigStore<Currency, "code">({
    items: CURRENCIES,
    storageKey: "currency",
    displayName: "Currency",
    idKey: "code",
    icon: "💰",
    driver: ctx.persistence,
  });

  function addCurrency(meta: Currency, dineroDef?: unknown) {
    const def = dineroDef || buildDineroDef(meta);
    registerCurrency(meta.code, def as DineroCurrency<number>);
    baseStore.addItems([meta]);
  }

  function convertAmount(
    amount: number,
    fromCode: string,
    toCode?: string,
  ): number {
    const target = toCode ?? String(baseStore.current);
    if (fromCode === target) return amount;
    if (!exchangeRateStore || !exchangeRateStore.hasRates) return amount;

    return exchangeRateStore.convertAmount(amount, fromCode, target);
  }

  const store = Object.assign(baseStore, {
    addCurrency,
    convertAmount,
  });

  Object.defineProperty(store, "canConvert", {
    get() {
      return !!exchangeRateStore?.hasRates;
    },
    enumerable: true,
    configurable: true,
  });

  const config = ctx.config;
  if (config?.currencies) {
    for (const cur of config.currencies) {
      store.addCurrency(cur);
    }
  }

  if (config?.defaultCurrency && !store.current) {
    if (store.get(config.defaultCurrency)) {
      store.set(config.defaultCurrency);
    }
  }

  return store as CurrencyStore;
}
