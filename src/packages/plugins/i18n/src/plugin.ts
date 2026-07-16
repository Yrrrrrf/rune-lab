import type { ConfigStore, SlotContext } from "@rune-lab/core";
import { definePlugin } from "@rune-lab/core";
import { createPluginKit } from "@rune-lab/svelte";
import { Schema } from "effect";
import { createLanguageStore, type Language } from "./lang/store.svelte.ts";
import {
  createExchangeRateStore,
  type Currency,
  currencyStore,
  type ExchangeRateStore,
  setExchangeRateStore,
} from "./money/mod.ts";
import { i18nSettings } from "./settings.ts";

export const i18nPluginSpec = definePlugin({
  id: "rune-lab.i18n",
  requires: [],
  slots: {
    language: {
      create: (ctx: SlotContext<unknown>) => createLanguageStore(ctx),
      config: Schema.Struct({
        defaultLanguage: Schema.optional(Schema.String),
        locales: Schema.optional(Schema.Array(Schema.String)),
      }) as any,
      persist: true,
      expose: true,
    },
    messages: {
      create: () => ({}),
      expose: true,
    },
    currency: {
      create: (ctx: SlotContext<unknown>) => {
        currencyStore.setDriver(ctx.persistence);

        const exchangeRate = ctx.stores.get(
          "exchangeRate",
        ) as ExchangeRateStore;
        if (exchangeRate) {
          setExchangeRateStore(exchangeRate);
        }

        const config = ctx.config as any;
        if (config?.currencies) {
          for (const cur of config.currencies) {
            currencyStore.addCurrency(cur);
          }
        }

        if (config?.defaultCurrency && !currencyStore.current) {
          if (currencyStore.get(config.defaultCurrency)) {
            currencyStore.set(config.defaultCurrency);
          }
        }

        return currencyStore;
      },
      config: Schema.Struct({
        defaultCurrency: Schema.optional(Schema.String),
        currencies: Schema.optional(Schema.Array(Schema.Any)),
      }) as any,
      dependsOn: ["exchangeRate"],
      persist: true,
      expose: true,
    },
    exchangeRate: {
      create: (ctx: SlotContext<unknown>) => {
        const store = createExchangeRateStore();
        const config = ctx.config as any;
        if (config?.exchangeRates) {
          store.setRates(config.exchangeRates.base, config.exchangeRates.rates);
        }
        return store;
      },
      expose: true,
    },
  },
  settings: i18nSettings,
});

const kit = createPluginKit(i18nPluginSpec);

export const I18nPlugin = kit.plugin;

export const getLanguageStore: () => ConfigStore<Language, "code"> = kit
  .accessors.getLanguageStore as any;

export const getCurrencyStore: () => ConfigStore<Currency, "code"> & {
  addCurrency: (meta: Currency, dineroDef?: unknown) => void;
  convertAmount: (amount: number, fromCode: string, toCode?: string) => number;
  readonly canConvert: boolean;
} = kit.accessors.getCurrencyStore as any;

export const getExchangeRateStore: () => ExchangeRateStore = kit.accessors
  .getExchangeRateStore as any;
