// sdk/core/src/money/money.ts
// Framework-agnostic money utilities using Dinero.js v2
// Consumers should never import Dinero directly — these helpers encapsulate it.

import {
  add as dineroAdd,
  AED,
  BRL,
  CAD,
  CNY,
  convert as dineroConvert,
  type Dinero,
  dinero,
  type DineroCurrency,
  type DineroSnapshot,
  EUR,
  GBP,
  INR,
  JPY,
  KRW,
  multiply as dineroMultiply,
  MXN,
  subtract as dineroSubtract,
  toDecimal,
  // ISO 4217 currency definitions
  toSnapshot,
  transformScale as dineroTransformScale,
  USD,
} from "dinero.js";

/**
 * Map of ISO 4217 currency codes to Dinero currency objects
 */
export const CURRENCY_MAP: Record<string, DineroCurrency<number>> = {
  USD,
  EUR,
  MXN,
  JPY,
  KRW,
  CNY,
  AED,
  GBP,
  CAD,
  BRL,
  INR,
};

/**
 * Derived type of all built-in ISO 4217 currency codes.
 * Enables IDE autocomplete while allowing any string for dynamic currencies.
 */
export type ISO4217Code = keyof typeof CURRENCY_MAP;

/**
 * Scaled integer rate for Dinero.js conversion.
 * Avoids floating-point errors by using integer amounts with a scale.
 */
export type ScaledRate = { amount: number; scale: number };

/**
 * Map of currency codes to their exchange rates relative to a base currency.
 * Rates can be plain numbers (integers) or ScaledRate objects.
 */
export type RateMap = Record<string, ScaledRate | number>;

/**
 * Converts a human-readable float rate (e.g., 17.23) into a ScaledRate.
 * Defaults to 4 decimal places of precision if not specified.
 */
export function scaledRate(float: number, precision: number = 4): ScaledRate {
  const factor = Math.pow(10, precision);
  return {
    amount: Math.round(float * factor),
    scale: precision,
  };
}

/**
 * Register a new currency in CURRENCY_MAP atomically.
 * Ensures the core registry and any store-level registries stay in sync.
 */
export function registerCurrency(
  code: string,
  currency: DineroCurrency<number>,
): void {
  CURRENCY_MAP[code] = currency;
}

/**
 * Normalizes an unknown input into a valid finite number.
 * Handles null, undefined, bigints, and SurrealDB Decimal objects via toString().
 */
function toNumber(amount: unknown): number {
  if (amount === null || amount === undefined) return 0;
  if (typeof amount === "number") return Number.isFinite(amount) ? amount : 0;
  if (typeof amount === "bigint") return Number(amount);

  // Handle SurrealDB Decimal (which has a toString method) or other objects
  if (typeof amount === "object") {
    try {
      // SurrealDB Decimal.toString() returns a numeric string
      const str = String(amount);
      const parsed = parseFloat(str);
      return Number.isFinite(parsed) ? parsed : 0;
    } catch {
      return 0;
    }
  }

  const coerced = Number(amount);
  return Number.isFinite(coerced) ? coerced : 0;
}

/**
 * Normalizes an unknown input into a valid integer for Dinero.js.
 * Exported so consumers can apply the same defensive coercion.
 */
export function safeAmount(amount: unknown): number {
  return Math.round(toNumber(amount));
}

/**
 * Converts a major-unit amount (e.g., pesos) to a minor-unit integer (e.g., centavos).
 * Uses the currency's exponent from CURRENCY_MAP.
 */
export function toMinorUnit(
  amount: unknown,
  currencyCode: ISO4217Code | string,
): number {
  const currency = CURRENCY_MAP[currencyCode];
  if (!currency) {
    throw new Error(
      `Unknown currency code: ${currencyCode}. Register it first via registerCurrency().`,
    );
  }
  const base = Array.isArray(currency.base) ? currency.base[0] : currency.base;
  const factor = Math.pow(Number(base), Number(currency.exponent));
  return Math.round(toNumber(amount) * factor);
}

/**
 * Create a Dinero monetary value from an amount.
 * @param amount - Amount (normalized internally via safeAmount)
 * @param currencyCode - ISO 4217 currency code (e.g., "USD")
 */
export function createMoney(
  amount: unknown,
  currencyCode: ISO4217Code | string,
): Dinero<number> {
  const currency = CURRENCY_MAP[currencyCode];
  if (!currency) {
    throw new Error(
      `Unknown currency code: ${currencyCode}. Register it first via registerCurrency().`,
    );
  }
  return dinero({ amount: safeAmount(amount), currency });
}

/**
 * Format a Dinero value as a locale-aware string
 * @param money - Dinero monetary value
 * @param locale - BCP 47 locale string (e.g., "en-US", "es-MX")
 * @param currencyCode - ISO 4217 code for Intl.NumberFormat (e.g., "USD")
 */
export function formatMoney(
  money: Dinero<number>,
  locale: string = "en-US",
  currencyCode?: string,
): string {
  return toDecimal(money, ({ value, currency }) => {
    const code = currencyCode ??
      Object.entries(CURRENCY_MAP).find(([, c]) => c.code === currency.code)
        ?.[0] ??
      currency.code;

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: currency.exponent,
      maximumFractionDigits: currency.exponent,
    }).format(Number(value));
  });
}

/**
 * Format a raw amount as a locale-aware currency string.
 * Convenience wrapper around createMoney + formatMoney.
 */
export function formatAmount(
  amount: unknown,
  currencyCode: ISO4217Code | string,
  locale: string = "en-US",
): string {
  const money = createMoney(amount, currencyCode);
  return formatMoney(money, locale, currencyCode);
}

/**
 * Add two monetary values (must be same currency)
 */
export function addMoney(a: Dinero<number>, b: Dinero<number>): Dinero<number> {
  return dineroAdd(a, b);
}

/**
 * Subtract two monetary values (must be same currency)
 */
export function subtractMoney(
  a: Dinero<number>,
  b: Dinero<number>,
): Dinero<number> {
  return dineroSubtract(a, b);
}

/**
 * Multiply a monetary value by a factor
 */
export function multiplyMoney(
  money: Dinero<number>,
  factor: number,
): Dinero<number> {
  return dineroMultiply(money, factor);
}

/**
 * Converts a Dinero object to another currency.
 * Both currencies must share the same base (base 10 for all standard ISO currencies).
 */
export function convertMoney(
  money: Dinero<number>,
  toCurrencyCode: string,
  rates: RateMap,
): Dinero<number> {
  const targetCurrency = CURRENCY_MAP[toCurrencyCode];
  if (!targetCurrency) {
    throw new Error(
      `Unknown target currency: ${toCurrencyCode}. Register it first via registerCurrency().`,
    );
  }

  const rate = rates[toCurrencyCode];
  if (rate === undefined) {
    throw new Error(`Missing exchange rate for currency: ${toCurrencyCode}`);
  }

  try {
    return dineroConvert(money, targetCurrency, { [toCurrencyCode]: rate });
  } catch (err) {
    if (err instanceof Error && err.message.includes("base")) {
      throw new Error(
        `Cannot convert between currencies with different bases. Ensure both are base 10.`,
      );
    }
    throw err;
  }
}

/**
 * Converts a raw minor-unit amount between currencies.
 * Returns the original amount if from and to currencies are the same.
 */
export function convertAmount(
  amount: number,
  fromCode: string,
  toCode: string,
  rates: RateMap,
): number {
  if (fromCode === toCode) return amount;
  const targetCurrency = CURRENCY_MAP[toCode];
  if (!targetCurrency) {
    throw new Error(`Unknown target currency: ${toCode}`);
  }

  const sourceMoney = createMoney(amount, fromCode);
  const convertedMoney = convertMoney(sourceMoney, toCode, rates);

  // Normalize back to the target currency's standard exponent
  const targetMoney = dineroTransformScale(
    convertedMoney,
    targetCurrency.exponent,
  );
  const snapshot = toSnapshot(targetMoney);

  return snapshot.amount;
}

/**
 * Converts Dinero object to a Stripe-compatible payload.
 */
export function toStripeMoney(money: Dinero<number>): {
  amount: number;
  currency: string;
} {
  const snapshot = toSnapshot(money);
  return {
    amount: snapshot.amount,
    currency: snapshot.currency.code.toLowerCase(),
  };
}

/**
 * Converts Dinero object to a PayPal-compatible payload.
 */
export function toPaypalMoney(money: Dinero<number>): {
  value: string;
  currency_code: string;
} {
  const value = toDecimal(money);
  const snapshot = toSnapshot(money);
  return {
    value,
    currency_code: snapshot.currency.code,
  };
}

/**
 * Converts Dinero object to an Adyen-compatible payload.
 */
export function toAdyenMoney(money: Dinero<number>): {
  value: number;
  currency: string;
} {
  const snapshot = toSnapshot(money);
  return {
    value: snapshot.amount,
    currency: snapshot.currency.code.toUpperCase(),
  };
}

/**
 * Converts Dinero object to a Square-compatible payload (uses BigInt).
 */
export function toSquareMoney(money: Dinero<number>): {
  amount: bigint;
  currency: string;
} {
  const snapshot = toSnapshot(money);
  return {
    amount: BigInt(snapshot.amount),
    currency: snapshot.currency.code,
  };
}

/**
 * Serializes a Dinero object into a plain object snapshot.
 */
export function toMoneySnapshot(money: Dinero<number>): {
  amount: number;
  currency: string;
  scale: number;
} {
  const snapshot = toSnapshot(money);
  return {
    amount: snapshot.amount,
    currency: snapshot.currency.code,
    scale: snapshot.scale,
  };
}

/**
 * Restores a Dinero object from a snapshot.
 */
export function fromMoneySnapshot(snapshot: {
  amount: number;
  currency: string;
  scale?: number;
}): Dinero<number> {
  const currency = CURRENCY_MAP[snapshot.currency];
  if (!currency) {
    throw new Error(
      `Unknown currency: ${snapshot.currency}. Register it first.`,
    );
  }
  return dinero({
    amount: snapshot.amount,
    currency,
    scale: snapshot.scale ?? currency.exponent,
  });
}

// Re-export types
export type { Dinero, DineroCurrency, DineroSnapshot };
