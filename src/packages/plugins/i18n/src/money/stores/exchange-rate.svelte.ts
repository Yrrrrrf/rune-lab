import {
  CURRENCY_MAP,
  type RateMap,
  type ScaledRate,
  scaledRate,
} from "../primitives/money.ts";
import { resolveRate } from "../primitives/strategies.ts";

function computeCrossRate(
  from: string,
  to: string,
  base: string,
  rates: RateMap,
): number | undefined {
  if (from === to) return 1.0;

  if (from === base) {
    const rateTo = rates[to];
    return rateTo !== undefined ? resolveRate(rateTo) : undefined;
  }

  if (to === base) {
    const rateFrom = rates[from];
    if (rateFrom !== undefined) {
      const r = resolveRate(rateFrom);
      return r !== 0 ? 1.0 / r : undefined;
    }
    return undefined;
  }

  const rateFrom = rates[from];
  const rateTo = rates[to];
  if (rateFrom !== undefined && rateTo !== undefined) {
    const rFrom = resolveRate(rateFrom);
    if (rFrom !== 0) {
      const rTo = resolveRate(rateTo);
      return rTo / rFrom;
    }
  }
  return undefined;
}

export function buildMatrix(
  base: string,
  rates: RateMap,
): Record<string, Record<string, number>> {
  if (!rates || Object.keys(rates).length === 0) {
    return {};
  }

  const currencies = new Set<string>([base, ...Object.keys(rates)]);
  const mat: Record<string, Record<string, number>> = {};

  for (const from of currencies) {
    mat[from] = {};
    for (const to of currencies) {
      const rate = computeCrossRate(from, to, base, rates);
      if (rate !== undefined) {
        mat[from][to] = rate;
      }
    }
  }

  return mat;
}

export class ExchangeRateStore {
  #rates = $state<RateMap>({});
  #baseCurrency = $state<string>("USD");

  #matrix = $derived.by(() => {
    return buildMatrix(this.#baseCurrency, this.#rates);
  });

  get rates(): RateMap {
    return this.#rates;
  }

  get baseCurrency(): string {
    return this.#baseCurrency;
  }

  get hasRates(): boolean {
    return Object.keys(this.#rates).length > 0;
  }

  setRates(base: string, rawRates: Record<string, number>) {
    const nextRates: RateMap = {};
    for (const [code, rate] of Object.entries(rawRates)) {
      nextRates[code] = scaledRate(rate, 4);
    }
    this.#baseCurrency = base;
    this.#rates = nextRates;
  }

  setScaledRates(base: string, rates: RateMap) {
    this.#baseCurrency = base;
    this.#rates = rates;
  }

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
      const rateScale = rateEntry && typeof rateEntry === "object"
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

  convertAmount(amount: number, fromCode: string, toCode: string): number {
    if (fromCode === toCode) return amount;
    if (!this.hasRates) return amount;

    const rate = this.#matrix[fromCode]?.[toCode];
    if (rate === undefined) return amount;

    return Math.round(amount * rate);
  }
}

export function createExchangeRateStore(): ExchangeRateStore {
  return new ExchangeRateStore();
}
