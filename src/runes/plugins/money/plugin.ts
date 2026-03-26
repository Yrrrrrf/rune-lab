import { defineRune, RUNE_LAB_CONTEXT } from "@rune-lab/kernel";
import type { PersistenceDriver, RunePlugin } from "@rune-lab/kernel";
import { createCurrencyStore, type Currency } from "./currency.svelte.ts";
import { createExchangeRateStore } from "./exchange-rate.svelte.ts";
import type { ExchangeRateStore } from "./exchange-rate.svelte.ts";

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
export const MoneyPlugin: RunePlugin = defineRune({
  id: "rune-lab.money",
  stores: [
    {
      id: "exchangeRate",
      contextKey: RUNE_LAB_CONTEXT.exchangeRate,
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
      contextKey: RUNE_LAB_CONTEXT.currency,
      factory: (
        config: unknown,
        driver: PersistenceDriver,
        stores: Map<string, unknown>,
      ) => {
        const c = config as MoneyConfig;
        return createCurrencyStore({
          driver,
          customCurrencies: c?.currencies,
          defaultCurrency: c?.defaultCurrency,
          exchangeRateStore: stores.get("exchangeRate") as ExchangeRateStore,
        });
      },
      dependsOn: ["exchangeRate"],
    },
  ],
});
