import type {
  ConfigStore,
  PersistenceDriver,
  RunePlugin,
} from "@rune-lab/svelte";
import { createAccessor, definePlugin } from "@rune-lab/svelte";
import {
  type Currency,
  type CurrencyStore,
  currencyStore,
  setExchangeRateStore,
} from "./currency.svelte.ts";
import type { ExchangeRateStore } from "./exchange-rate.svelte.ts";
import { createExchangeRateStore } from "./exchange-rate.svelte.ts";

export const MONEY_CONTEXT = {
  currency: Symbol("rl:currency"),
  exchangeRate: Symbol("rl:exchange-rate"),
};

export const getCurrencyStore: () => ConfigStore<Currency, "code"> & {
  addCurrency: (meta: Currency, dineroDef?: unknown) => void;
  convertAmount: (amount: number, fromCode: string, toCode?: string) => number;
  readonly canConvert: boolean;
} = createAccessor<CurrencyStore>(
  MONEY_CONTEXT.currency,
  "getCurrencyStore()",
  "CurrencyStore",
  "MoneyPlugin",
);

export { default as CurrencySelector } from "./CurrencySelector.svelte";
export * from "./currency.svelte.ts";
export * from "./exchange-rate.svelte.ts";
export { default as MoneyDisplay } from "./MoneyDisplay.svelte";
export { default as MoneyInput } from "./MoneyInput.svelte";
export * from "./money.ts";
export * from "./money-primitive.ts";
export * from "./strategies.ts";
export * from "./types.ts";
export * from "./useMoney.ts";
export * from "./useMoneyFilter.svelte.ts";

interface MoneyConfig {
  exchangeRates?: {
    base: string;
    rates: Record<string, number>;
  };
  currencies?: Currency[];
  defaultCurrency?: string;
}

/**
 * Money Plugin — provides currency management and exchange rate conversion.
 */
export const MoneyPlugin: RunePlugin = definePlugin({
  id: "rune-lab.money",
  stores: [
    {
      id: "exchangeRate",
      contextKey: MONEY_CONTEXT.exchangeRate,
      factory: (config: unknown) => {
        const store = createExchangeRateStore();
        const c = config as MoneyConfig;
        if (c?.exchangeRates) {
          store.setRates(c.exchangeRates.base, c.exchangeRates.rates);
        }
        return store;
      },
      noPersistence: true,
    },
    {
      id: "currency",
      contextKey: MONEY_CONTEXT.currency,
      factory: (
        config: unknown,
        driver: PersistenceDriver,
        stores: Map<string, unknown>,
      ) => {
        // FIX: inject the real driver so currency selection is persisted.
        // Previously `_driver` was ignored, leaving the singleton on its
        // default createInMemoryDriver() — wiped on every page reload.
        currencyStore.setDriver(driver);

        const c = config as MoneyConfig;
        setExchangeRateStore(stores.get("exchangeRate") as ExchangeRateStore);

        if (c?.currencies) {
          for (const cur of c.currencies) {
            currencyStore.addCurrency(cur);
          }
        }

        if (c?.defaultCurrency && !currencyStore.current) {
          if (currencyStore.get(c.defaultCurrency)) {
            currencyStore.set(c.defaultCurrency);
          }
        }

        return currencyStore;
      },
      dependsOn: ["exchangeRate"],
    },
  ],
});
