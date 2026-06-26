import { defineRune, RUNE_LAB_CONTEXT } from "../../../../kernel/src/mod.ts";
import type {
  PersistenceDriver,
  RunePlugin,
} from "../../../../kernel/src/mod.ts";
import {
  type Currency,
  currencyStore,
  setExchangeRateStore,
} from "./currency.svelte.ts";
import { createExchangeRateStore } from "./exchange-rate.svelte.ts";
import type { ExchangeRateStore } from "./exchange-rate.svelte.ts";

export * from "./currency.svelte.ts";
export * from "./exchange-rate.svelte.ts";
export * from "./types.ts";
export * from "./money.ts";
export * from "./strategies.ts";
export * from "./money-primitive.ts";
export * from "./useMoney.ts";
export * from "./useMoneyFilter.svelte.ts";
export { default as CurrencySelector } from "./CurrencySelector.svelte";
export { default as MoneyDisplay } from "./MoneyDisplay.svelte";
export { default as MoneyInput } from "./MoneyInput.svelte";

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
          if (currencyStore.get(c.defaultCurrency as never)) {
            currencyStore.set(c.defaultCurrency as never);
          }
        }

        return currencyStore;
      },
      dependsOn: ["exchangeRate"],
    },
  ],
});
