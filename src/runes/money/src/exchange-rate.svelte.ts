// sdk/state/src/exchange-rate.svelte.ts

import { getContext } from "svelte";
import {
  convertMoney,
  createMoney,
  CURRENCY_MAP,
  directConversion,
  inverseConversion,
  type RateMap,
  resolveRate,
  type ScaledRate,
  scaledRate,
  toMoneySnapshot,
  triangularConversion,
} from "@rune-lab/money";
import { RUNE_LAB_CONTEXT } from "@rune-lab/kernel";

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

      const currentRates = this.#rates;
      const currentBase = this.#baseCurrency;

      const sourceMoney = createMoney(oneUnit, fromCode);

      let targetMoney;
      if (fromCode === currentBase) {
        // Direct: base → target
        targetMoney = convertMoney(sourceMoney, toCode, currentRates);
      } else if (toCode === currentBase) {
        // Inverse: target → base
        const rateToBase = currentRates[fromCode];
        if (!rateToBase) return undefined;
        const r = resolveRate(rateToBase);
        targetMoney = convertMoney(sourceMoney, toCode, {
          [toCode]: scaledRate(1 / r, 6),
        });
      } else {
        // Triangular: source → base → target
        const rateToBase = currentRates[fromCode];
        const rateToTarget = currentRates[toCode];
        if (!rateToBase || !rateToTarget) return undefined;

        const r1 = resolveRate(rateToBase);
        const r2 = resolveRate(rateToTarget);

        targetMoney = convertMoney(sourceMoney, toCode, {
          [toCode]: scaledRate(r2 / r1, 6),
        });
      }

      const snapshot = toMoneySnapshot(targetMoney);
      return {
        amount: snapshot.amount,
        scale: snapshot.scale,
      };
    } catch (_err) {
      return undefined;
    }
  }

  /**
   * Internal conversion logic that handles triangulation through base currency.
   * Delegates all math to ConversionStrategies (directConversion, inverseConversion, triangularConversion).
   */
  convertAmount(amount: number, fromCode: string, toCode: string): number {
    if (fromCode === toCode) return amount;
    if (!this.hasRates) return amount;

    // Direct: Base → Target
    if (fromCode === this.#baseCurrency) {
      const rateToTarget = this.#rates[toCode];
      if (!rateToTarget) return amount;
      return directConversion(amount, resolveRate(rateToTarget));
    }

    // Inverse: Target → Base
    if (toCode === this.#baseCurrency) {
      const rateFromSource = this.#rates[fromCode];
      if (!rateFromSource) return amount;
      return inverseConversion(amount, resolveRate(rateFromSource));
    }

    // Triangulation: From → Base → To
    const rateFromSource = this.#rates[fromCode];
    const rateToTarget = this.#rates[toCode];
    if (!rateFromSource || !rateToTarget) return amount;

    return triangularConversion(
      amount,
      resolveRate(rateFromSource),
      resolveRate(rateToTarget),
    );
  }
}

/**
 * Factory to create the ExchangeRateStore.
 */
export function createExchangeRateStore() {
  return new ExchangeRateStore();
}

/**
 * Consumer to retrieve the ExchangeRateStore from context.
 */
export function getExchangeRateStore() {
  return getContext<ExchangeRateStore>(RUNE_LAB_CONTEXT.exchangeRate);
}
