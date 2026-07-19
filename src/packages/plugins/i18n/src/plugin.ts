import type { ConfigStore, ForgedPlugin, SlotSpec } from "@rune-lab/core";
import { definePlugin, defineSlot } from "@rune-lab/core";
import { Schema } from "effect";
import { createLanguageStore, type Language } from "./lang/store.svelte.ts";
import {
  createCurrencyStore,
  createExchangeRateStore,
  type CurrencyConfig,
  type CurrencyStore,
  type ExchangeRateStore,
} from "./money/mod.ts";
import { i18nSettings } from "./settings.ts";

const i18nPluginSpec = definePlugin({
  id: "rune-lab.i18n",
  requires: [],
  slots: {
    language: defineSlot({
      create: (ctx) => createLanguageStore(ctx),
      config: Schema.Struct({
        defaultLanguage: Schema.optional(Schema.String),
        locales: Schema.optional(Schema.Array(Schema.String)),
      }),
      persist: true,
      expose: true,
    }),
    messages: defineSlot({
      create: () => ({}),
      expose: true,
    }),
    currency: defineSlot({
      create: (ctx) => {
        const exchangeRate = ctx.stores.get(
          "exchangeRate",
        ) as ExchangeRateStore;
        return createCurrencyStore(ctx, exchangeRate);
      },
      config: Schema.Struct({
        defaultCurrency: Schema.optional(Schema.String),
        currencies: Schema.optional(
          Schema.Array(
            Schema.Struct({
              code: Schema.String,
              symbol: Schema.String,
              decimals: Schema.Number,
            }),
          ),
        ),
      }),
      dependsOn: ["exchangeRate"],
      persist: true,
      expose: true,
    }),
    exchangeRate: defineSlot({
      create: (ctx) => {
        const store = createExchangeRateStore();
        const config = ctx.config;
        if (config?.exchangeRates) {
          store.setRates(config.exchangeRates.base, config.exchangeRates.rates);
        }
        return store;
      },
      config: Schema.Struct({
        exchangeRates: Schema.optional(
          Schema.Struct({
            base: Schema.String,
            rates: Schema.Record({
              key: Schema.String,
              value: Schema.Number,
            }),
          }),
        ),
      }),
      expose: true,
    }),
  },
  settings: i18nSettings,
});

type I18nSlots = {
  language: SlotSpec<
    { readonly defaultLanguage?: string; readonly locales?: readonly string[] },
    ConfigStore<Language, "code">,
    { readonly defaultLanguage?: string; readonly locales?: readonly string[] }
  >;
  messages: SlotSpec<unknown, Record<string, unknown>>;
  currency: SlotSpec<CurrencyConfig, CurrencyStore, CurrencyConfig>;
  exchangeRate: SlotSpec<
    {
      readonly exchangeRates?: {
        readonly base: string;
        readonly rates: Record<string, number>;
      };
    },
    ExchangeRateStore,
    {
      readonly exchangeRates?: {
        readonly base: string;
        readonly rates: Record<string, number>;
      };
    }
  >;
};

export const I18nPlugin: ForgedPlugin<"rune-lab.i18n", I18nSlots> =
  i18nPluginSpec;
