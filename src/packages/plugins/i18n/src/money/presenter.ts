import type { ItemPresenter } from "rune-lab/core";
import { CURRENCIES, getCurrencyName } from "./stores/currency.svelte.ts";
import type { Currency } from "./types.ts";

export const currencyPresenter: ItemPresenter<Currency> = {
  items: CURRENCIES,
  id: (c) => c.code,
  present: (c) => ({ label: getCurrencyName(c), icon: c.symbol }),
};
