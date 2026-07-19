import type { ConfigStore } from "@rune-lab/core";
import { getContextSymbol } from "@rune-lab/core";
import { createAccessor } from "@rune-lab/svelte";
import type { Language } from "./lang/store.svelte.ts";
import type { CurrencyStore, ExchangeRateStore } from "./money/mod.ts";

const PLUGIN_ID = "rune-lab.i18n";

export const getLanguageStore: () => ConfigStore<Language, "code"> =
  createAccessor<ConfigStore<Language, "code">>(
    getContextSymbol(PLUGIN_ID, "language"),
    "getLanguageStore()",
    "LanguageStore",
    PLUGIN_ID,
  );

export const getCurrencyStore: () => CurrencyStore = createAccessor<
  CurrencyStore
>(
  getContextSymbol(PLUGIN_ID, "currency"),
  "getCurrencyStore()",
  "CurrencyStore",
  PLUGIN_ID,
);

export const getExchangeRateStore: () => ExchangeRateStore = createAccessor<
  ExchangeRateStore
>(
  getContextSymbol(PLUGIN_ID, "exchangeRate"),
  "getExchangeRateStore()",
  "ExchangeRateStore",
  PLUGIN_ID,
);
