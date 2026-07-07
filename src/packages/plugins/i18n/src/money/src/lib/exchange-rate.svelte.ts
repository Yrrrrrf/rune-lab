// sdk/state/src/exchange-rate.svelte.ts

import {
  CURRENCY_MAP,
  type RateMap,
  type ScaledRate,
  scaledRate,
} from "./money.ts";
import { resolveRate } from "./strategies.ts";

export class ExchangeRateStore {
  #rates = $state<RateMap>({});
  #baseCurrency = $state<string>("USD");

  /**
   * Combined reactive cross-rate matrix: from -> to -> floatRate
   */
  #matrix = $derived.by(() => {
    const base = this.#baseCurrency;
    const rates = this.#rates;
    if (!rates || Object.keys(rates).length === 0) {
      return {};
    }

    const currencies = new Set<string>([base, ...Object.keys(rates)]);
    const mat: Record<string, Record<string, number>> = {};

    for (const from of currencies) {
      mat[from] = {};
      for (const to of currencies) {
        if (from === to) {
          mat[from][to] = 1.0;
          continue;
        }

        // Direct: base -> to
        if (from === base) {
          const rateTo = rates[to];
          if (rateTo !== undefined) {
            mat[from][to] = resolveRate(rateTo);
          }
        } // Inverse: from -> base
        else if (to === base) {
          const rateFrom = rates[from];
          if (rateFrom !== undefined) {
            const r = resolveRate(rateFrom);
            if (r !== 0) {
              mat[from][to] = 1.0 / r;
            }
          }
        } // Triangular: from -> base -> to
        else {
          const rateFrom = rates[from];
          const rateTo = rates[to];
          if (rateFrom !== undefined && rateTo !== undefined) {
            const rFrom = resolveRate(rateFrom);
            if (rFrom !== 0) {
              const rTo = resolveRate(rateTo);
              mat[from][to] = rTo / rFrom;
            }
          }
        }
      }
    }

    return mat;
  });

  /**
   * The current exchange rates relative to the base currency.
   */
  get rates(): RateMap {
    return this.#rates;
  }

  /**
   * The base currency all rates are relative to.
   */
  get baseCurrency(): string {
    return this.#baseCurrency;
  }

  /**
   * Returns true if exchange rates have been loaded.
   */
  get hasRates(): boolean {
    return Object.keys(this.#rates).length > 0;
  }

  /**
   * Set exchange rates from a human-readable float map.
   * @param base - The base currency code (e.g., "USD")
   * @param rawRates - A map of currency codes to float rates (e.g., { MXN: 17.23 })
   */
  setRates(base: string, rawRates: Record<string, number>) {
    const nextRates: RateMap = {};
    for (const [code, rate] of Object.entries(rawRates)) {
      nextRates[code] = scaledRate(rate, 4);
    }
    this.#baseCurrency = base;
    this.#rates = nextRates;
  }

  /**
   * Directly set pre-scaled rates.
   */
  setScaledRates(base: string, rates: RateMap) {
    this.#baseCurrency = base;
    this.#rates = rates;
  }

  /**
   * Resolves the exchange rate between two currencies.
   * Returns a ScaledRate representing how many units of toCode are in 1 unit of fromCode.
   */
  getRate(fromCode: string, toCode: string): ScaledRate | number | undefined {
    if (fromCode === toCode) return 1;

    const fromCurrency = CURRENCY_MAP[fromCode];
    const toCurrency = CURRENCY_MAP[toCode];
    if (!fromCurrency || !toCurrency) return undefined;

    if (!this.hasRates) return undefined;

    const rate = this.#matrix[fromCode]?.[toCode];
    if (rate === undefined) return undefined;

    let scale = 6;
    if (fromCode === this.#baseCurrency) {
      const rateEntry = this.#rates[toCode];
      const rateScale = (rateEntry && typeof rateEntry === "object")
        ? rateEntry.scale
        : 4;
      const exponent = toCurrency.exponent;
      scale = exponent + rateScale;
    } else {
      const exponent = toCurrency.exponent;
      scale = exponent + 6;
    }

    return scaledRate(rate, scale);
  }

  /**
   * Internal conversion logic that reads directly from the derived cross-rate matrix.
   */
  convertAmount(amount: number, fromCode: string, toCode: string): number {
    if (fromCode === toCode) return amount;
    if (!this.hasRates) return amount;

    const rate = this.#matrix[fromCode]?.[toCode];
    if (rate === undefined) return amount;

    return Math.round(amount * rate);
  }
}

/**
 * Factory to create the ExchangeRateStore.
 */
export function createExchangeRateStore(): ExchangeRateStore {
  return new ExchangeRateStore();
}
