import { currencyStore as _currencyStore } from "$lib/state/currency.svelte";
export type { Currency } from "$lib/state/currency.svelte";

if (import.meta.env?.DEV) {
  console.warn(
    '[DEPRECATED] Import from "$lib/features/config/stores/currency.svelte" is deprecated. Use "$lib/state/currency.svelte" instead.',
  );
}

export const currencyStore = _currencyStore;
