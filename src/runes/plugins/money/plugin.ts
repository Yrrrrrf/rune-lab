import { defineRune, RUNE_LAB_CONTEXT } from "@rune-lab/kernel";
import type { PersistenceDriver, RunePlugin } from "@rune-lab/kernel";
import { createCurrencyStore, type Currency } from "./currency.svelte.ts";
import { createExchangeRateStore } from "./exchange-rate.svelte.ts";
import type { ExchangeRateStore } from "./exchange-rate.svelte.ts";

/**
 * Money Plugin — provides currency management and exchange rate conversion.
 */
export const MoneyPlugin: RunePlugin = defineRune({
  id: "rune-lab.money",
  stores: [
    {
      id: "exchangeRate",
      contextKey: RUNE_LAB_CONTEXT.exchangeRate,
      factory: (config: any) => {
        const store = createExchangeRateStore();
        if (config.exchangeRates) {
          const rates = config.exchangeRates as {
            base: string;
            rates: Record<string, number>;
          };
          store.setRates(rates.base, rates.rates);
        }
        return store;
      },
      noPersistence: true,
    },
    {
      id: "currency",
      contextKey: RUNE_LAB_CONTEXT.currency,
      factory: (
        config: any,
        driver: PersistenceDriver,
        stores: Map<string, any>,
      ) => {
        return createCurrencyStore({
          driver,
          customCurrencies: config.currencies as Currency[],
          defaultCurrency: config.defaultCurrency as string,
          exchangeRateStore: stores.get("exchangeRate") as ExchangeRateStore,
        });
      },
      dependsOn: ["exchangeRate"],
    },
  ],
});
