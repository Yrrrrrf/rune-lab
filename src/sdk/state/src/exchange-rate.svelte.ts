// sdk/state/src/exchange-rate.svelte.ts

import { getContext, setContext } from "svelte";
import {
  convertAmount,
  convertMoney,
  createMoney,
  CURRENCY_MAP,
  type RateMap,
  type ScaledRate,
  scaledRate,
  toMoneySnapshot,
} from "@internal/core";
import { RUNE_LAB_CONTEXT } from "./context.ts";

export class ExchangeRateStore {
  #rates = $state<RateMap>({});
  #baseCurrency = $state<string>("USD");

  /**
   * The current exchange rates relative to the base currency.
   */
  get rates() {
    return this.#rates;
  }

  /**
   * The base currency all rates are relative to.
   */
  get baseCurrency() {
    return this.#baseCurrency;
  }

  /**
   * Returns true if exchange rates have been loaded.
   */
  get hasRates() {
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

    try {
      // 1 unit of fromCode (major unit)
      const oneUnit = Math.pow(
        Array.isArray(fromCurrency.base)
          ? fromCurrency.base[0]
          : fromCurrency.base,
        fromCurrency.exponent,
      );

      // Convert through base if necessary
      const currentRates = this.#rates;
      const currentBase = this.#baseCurrency;

      // We use createMoney and convertMoney directly to get the Dinero object and its snapshot
      const sourceMoney = createMoney(oneUnit, fromCode);
      
      let targetMoney;
      if (fromCode === currentBase) {
        targetMoney = convertMoney(sourceMoney, toCode, currentRates);
      } else if (toCode === currentBase) {
        const rateToBase = currentRates[fromCode];
        if (!rateToBase) return undefined;
        const r = typeof rateToBase === "number" ? rateToBase : rateToBase.amount / Math.pow(10, rateToBase.scale);
        targetMoney = convertMoney(sourceMoney, toCode, { [toCode]: scaledRate(1 / r, 6) });
      } else {
        // Triangulate
        const rateToBase = currentRates[fromCode];
        const rateToTarget = currentRates[toCode];
        if (!rateToBase || !rateToTarget) return undefined;
        
        const r1 = typeof rateToBase === "number" ? rateToBase : rateToBase.amount / Math.pow(10, rateToBase.scale);
        const r2 = typeof rateToTarget === "number" ? rateToTarget : rateToTarget.amount / Math.pow(10, rateToTarget.scale);
        
        targetMoney = convertMoney(sourceMoney, toCode, { [toCode]: scaledRate(r2 / r1, 6) });
      }

      const snapshot = toMoneySnapshot(targetMoney);
      return {
        amount: snapshot.amount,
        scale: snapshot.scale,
      };
    } catch (err) {
      return undefined;
    }
  }

  /**
   * Internal conversion logic that handles triangulation through base currency.
   */
  convertAmount(amount: number, fromCode: string, toCode: string): number {
    if (fromCode === toCode) return amount;
    if (!this.hasRates) return amount;

    // Direct: Base -> Target
    if (fromCode === this.#baseCurrency) {
      return convertAmount(amount, fromCode, toCode, this.#rates);
    }

    // Inverse: Target -> Base
    if (toCode === this.#baseCurrency) {
      const rateToBase = this.#rates[fromCode];
      if (!rateToBase) return amount;

      // Dinero convert doesn't easily do inverse without a rate map where BASE is the key.
      // We can simulate it by creating a temporary rate map.
      const r = typeof rateToBase === "number"
        ? rateToBase
        : rateToBase.amount / Math.pow(10, rateToBase.scale);
      const inverseRate = scaledRate(1 / r, 6);
      
      return convertAmount(amount, fromCode, toCode, {
        [toCode]: inverseRate,
      });
    }

    // Triangulation: From -> Base -> To
    const amountInBase = this.convertAmount(amount, fromCode, this.#baseCurrency);
    return this.convertAmount(amountInBase, this.#baseCurrency, toCode);
  }
}

/**
 * Factory to create and provide the ExchangeRateStore in context.
 */
export function createExchangeRateStore() {
  const store = new ExchangeRateStore();
  setContext(RUNE_LAB_CONTEXT.exchangeRate, store);
  return store;
}

/**
 * Consumer to retrieve the ExchangeRateStore from context.
 */
export function getExchangeRateStore() {
  return getContext<ExchangeRateStore>(RUNE_LAB_CONTEXT.exchangeRate);
}
