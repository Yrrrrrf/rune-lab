// sdk/state/src/composables/useMoneyFilter.ts

import { getContext, untrack } from "svelte";
import { RUNE_LAB_CONTEXT } from "../../../../kernel/src/mod.ts";
import type { CurrencyStore } from "./mod.ts";
import { useMoney } from "./useMoney.ts";

export interface MoneyFilterOptions {
  min?: number;
  max?: number;
  unit?: "major" | "minor";
  autoConvertOnChange?: boolean;
}

export interface UseMoneyFilterReturn {
  min: number;
  max: number;
  readonly displayMin: string;
  readonly displayMax: string;
  setMin: (value: number) => void;
  setMax: (value: number) => void;
  reset: () => void;
  matches: (amount: number, entityCurrency: string) => boolean;
}

/**
 * A reactive currency-aware filter composable.
 * Handles min/max thresholds that auto-convert when the display currency changes.
 */
export function useMoneyFilter(
  options: MoneyFilterOptions = {},
): UseMoneyFilterReturn {
  const currencyStore = getContext<CurrencyStore>(RUNE_LAB_CONTEXT.currency);
  const { format } = useMoney();

  let min = $state(options.min ?? 0);
  let max = $state(options.max ?? Infinity);
  const unit = options.unit ?? "minor";
  const autoConvertOnChange = options.autoConvertOnChange ?? true;

  let lastCurrency = $state(String(currencyStore.current));

  $effect(() => {
    const currentCurrency = String(currencyStore.current);
    const previousCurrency = untrack(() => lastCurrency);

    if (autoConvertOnChange && currentCurrency !== previousCurrency) {
      if (currencyStore.canConvert) {
        if (min !== 0) {
          min = currencyStore.convertAmount(
            min,
            previousCurrency,
            currentCurrency,
          );
        }
        if (max !== Infinity) {
          max = currencyStore.convertAmount(
            max,
            previousCurrency,
            currentCurrency,
          );
        }
      } else {
        // Reset if no rates available
        min = 0;
        max = Infinity;
      }
      untrack(() => {
        lastCurrency = currentCurrency;
      });
    }
  });

  function setMin(value: number) {
    min = value;
  }

  function setMax(value: number) {
    max = value;
  }

  function reset() {
    min = 0;
    max = Infinity;
  }

  /**
   * Checks if an amount (in its entity currency) matches the current filter.
   */
  function matches(amount: number, entityCurrency: string): boolean {
    const currentCurrency = String(currencyStore.current);

    // Convert entity amount to display currency for comparison
    const convertedAmount = currencyStore.convertAmount(
      amount,
      entityCurrency,
      currentCurrency,
    );

    return convertedAmount >= min && convertedAmount <= max;
  }

  const displayMin = $derived(format(min, undefined, unit));
  const displayMax = $derived(
    max === Infinity ? "∞" : format(max, undefined, unit),
  );

  return {
    get min() {
      return min;
    },
    set min(v) {
      min = v;
    },
    get max() {
      return max;
    },
    set max(v) {
      max = v;
    },
    get displayMin() {
      return displayMin;
    },
    get displayMax() {
      return displayMax;
    },
    setMin,
    setMax,
    reset,
    matches,
  };
}
