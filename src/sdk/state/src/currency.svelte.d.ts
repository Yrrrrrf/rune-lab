import {
  type ConfigStore,
  createConfigStore,
} from "./createConfigStore.svelte.ts";
/**
 * Currency configuration
 * Based on ISO 4217 currency codes
 */
export interface Currency {
  code: string;
  symbol: string;
  decimals: number;
}
import type { PersistenceDriver } from "@internal/core";
import { type ExchangeRateStore } from "./exchange-rate.svelte.ts";
export interface CurrencyStoreOptions {
  driver?: PersistenceDriver | (() => PersistenceDriver | undefined);
  /** Additional custom currencies to append to the built-in set */
  customCurrencies?: Currency[];
  /** Default currency code if no persisted value exists */
  defaultCurrency?: string;
  /** Wired exchange rate store for conversions */
  exchangeRateStore?: ExchangeRateStore;
}
export declare function createCurrencyStore(
  driverOrOptions?:
    | PersistenceDriver
    | (() => PersistenceDriver | undefined)
    | CurrencyStoreOptions,
): ReturnType<typeof createConfigStore<Currency>> & {
  addCurrency: (meta: Currency, dineroDef?: unknown) => void;
  convertAmount: (amount: number, fromCode: string, toCode?: string) => number;
  readonly canConvert: boolean;
};
export type CurrencyStore = ReturnType<typeof createCurrencyStore>;
export declare function getCurrencyStore(): ConfigStore<Currency> & {
  addCurrency: (meta: Currency, dineroDef?: unknown) => void;
  convertAmount: (amount: number, fromCode: string, toCode?: string) => number;
  readonly canConvert: boolean;
};
