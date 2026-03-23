// sdk/core/src/money/money.ts
// Framework-agnostic money utilities using Dinero.js v2
// Consumers should never import Dinero directly — these helpers encapsulate it.

import {
  add as dineroAdd,
  AED,
  BRL,
  CAD,
  CNY,
  type Dinero,
  dinero,
  type DineroCurrency,
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
      Object.entries(CURRENCY_MAP).find(
        ([, c]) => c.code === currency.code,
      )?.[0] ??
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
export function addMoney(
  a: Dinero<number>,
  b: Dinero<number>,
): Dinero<number> {
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

// Re-export the Dinero type for type annotations
export type { Dinero, DineroCurrency };
