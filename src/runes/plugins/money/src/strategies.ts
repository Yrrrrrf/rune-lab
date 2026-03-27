// sdk/core/src/exchange-rate/strategies.ts
// Pure conversion strategy functions — no store or context dependencies.
// Extracted from ExchangeRateStore to enable independent testing and extensibility.

import type { ScaledRate } from "./money.ts";

// ── Types ──────────────────────────────────────────────────────────────────────

/**
 * A pure function that converts a minor-unit amount using a rate.
 * All strategy functions must be deterministic and side-effect-free.
 */
export type ConversionFn = (amount: number, ...rates: number[]) => number;

/**
 * Resolves a ScaledRate or plain number into a float rate value.
 */
export function resolveRate(rate: ScaledRate | number): number {
  if (typeof rate === "number") return rate;
  return rate.amount / Math.pow(10, rate.scale);
}

// ── Strategy Functions ─────────────────────────────────────────────────────────

/**
 * Direct conversion: base currency → target currency.
 * Multiplies the amount by the rate.
 *
 * @param amount - Minor-unit amount in the source currency
 * @param rate - Conversion rate (1 source = `rate` target)
 * @returns Minor-unit amount in the target currency
 */
export function directConversion(amount: number, rate: number): number {
  return Math.round(amount * rate);
}

/**
 * Inverse conversion: target currency → base currency.
 * Divides the amount by the rate.
 *
 * @param amount - Minor-unit amount in the source currency
 * @param rate - Conversion rate of source relative to base (1 base = `rate` source)
 * @returns Minor-unit amount in the base currency
 */
export function inverseConversion(amount: number, rate: number): number {
  if (rate === 0) {
    throw new Error("Cannot perform inverse conversion with a rate of zero.");
  }
  return Math.round(amount / rate);
}

/**
 * Triangular conversion: source → base → target (cross-rate).
 * First divides by the source-to-base rate, then multiplies by the base-to-target rate.
 *
 * @param amount - Minor-unit amount in the source currency
 * @param rateSourceToBase - Rate of source relative to base (1 base = `rate` source)
 * @param rateBaseToTarget - Rate of base to target (1 base = `rate` target)
 * @returns Minor-unit amount in the target currency
 */
export function triangularConversion(
  amount: number,
  rateSourceToBase: number,
  rateBaseToTarget: number,
): number {
  if (rateSourceToBase === 0) {
    throw new Error(
      "Cannot perform triangular conversion: source-to-base rate is zero.",
    );
  }
  const amountInBase = amount / rateSourceToBase;
  return Math.round(amountInBase * rateBaseToTarget);
}

// ── Strategy Registry ──────────────────────────────────────────────────────────

/**
 * Named map of conversion strategies.
 * Consumer code and the ExchangeRateStore can select a strategy by name.
 * Extensible: register additional strategies before store initialization.
 *
 * @example
 * ```ts
 * CONVERSION_STRATEGIES["crypto"] = (amount, rate) => {
 *   // 18-decimal precision logic
 * };
 * ```
 */
export const CONVERSION_STRATEGIES: Record<string, ConversionFn> = {
  direct: directConversion,
  inverse: inverseConversion,
  // triangularConversion takes 2 rates — wrapped for the registry signature
  triangular: (amount: number, ...rates: number[]) =>
    triangularConversion(amount, rates[0], rates[1]),
};
