// sdk/core/src/money/money-primitive.ts
// Immutable Value Object for monetary amounts.
// Zero Svelte dependencies — pure TypeScript class.

import { CURRENCY_MAP, type ISO4217Code } from "@rune-lab/money";

/**
 * Serializable representation of a MoneyPrimitive.
 * Used for persistence drivers and JSON round-trips.
 */
export interface MoneyJSON {
  amount: number;
  currencyCode: string;
  scale: number;
}

/**
 * Immutable Value Object that encapsulates a monetary amount, its currency,
 * and the scale (number of decimal places).
 *
 * Amounts are always stored in minor units (e.g., cents for USD, centavos for MXN).
 * The scale is derived from the currency's exponent in CURRENCY_MAP.
 *
 * @example
 * ```ts
 * const price = MoneyPrimitive.fromMajor(12.99, "USD");
 * price.minor;           // 1299
 * price.major;           // 12.99
 * price.format("en-US"); // "$12.99"
 *
 * const json = price.toJSON();
 * const restored = MoneyPrimitive.fromJSON(json);
 * ```
 */
export class MoneyPrimitive {
  /** Raw amount in minor units (e.g., cents). */
  readonly amount: number;
  /** ISO 4217 currency code. */
  readonly currencyCode: string;
  /** Number of decimal places for this currency (e.g., 2 for USD, 0 for JPY). */
  readonly scale: number;

  private constructor(amount: number, currencyCode: string, scale: number) {
    this.amount = Math.round(amount);
    this.currencyCode = currencyCode;
    this.scale = scale;
  }

  // ── Factories ────────────────────────────────────────────────────────────

  /**
   * Create a MoneyPrimitive from a minor-unit integer amount.
   * @param amount - Amount in minor units (e.g., 1299 for $12.99)
   * @param currencyCode - ISO 4217 currency code
   */
  static fromMinor(
    amount: number,
    currencyCode: ISO4217Code | string,
  ): MoneyPrimitive {
    const scale = MoneyPrimitive.resolveScale(currencyCode);
    return new MoneyPrimitive(amount, currencyCode, scale);
  }

  /**
   * Create a MoneyPrimitive from a major-unit float amount.
   * @param amount - Amount in major units (e.g., 12.99 for $12.99)
   * @param currencyCode - ISO 4217 currency code
   */
  static fromMajor(
    amount: number,
    currencyCode: ISO4217Code | string,
  ): MoneyPrimitive {
    const scale = MoneyPrimitive.resolveScale(currencyCode);
    const factor = Math.pow(10, scale);
    return new MoneyPrimitive(Math.round(amount * factor), currencyCode, scale);
  }

  /**
   * Restore a MoneyPrimitive from its JSON representation.
   */
  static fromJSON(json: MoneyJSON): MoneyPrimitive {
    return new MoneyPrimitive(json.amount, json.currencyCode, json.scale);
  }

  // ── Computed Getters ─────────────────────────────────────────────────────

  /** Amount in minor units (alias for `amount`). */
  get minor(): number {
    return this.amount;
  }

  /** Amount in major units (e.g., 12.99 for 1299 cents). */
  get major(): number {
    if (this.scale === 0) return this.amount;
    return this.amount / Math.pow(10, this.scale);
  }

  // ── Formatting ───────────────────────────────────────────────────────────

  /**
   * Format this monetary value as a locale-aware currency string.
   * @param locale - BCP 47 locale string (default: "en-US")
   */
  format(locale: string = "en-US"): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: this.currencyCode,
      minimumFractionDigits: this.scale,
      maximumFractionDigits: this.scale,
    }).format(this.major);
  }

  // ── Arithmetic (returns new instances — immutability) ────────────────────

  /**
   * Add another MoneyPrimitive (must be same currency).
   * Returns a new MoneyPrimitive.
   */
  add(other: MoneyPrimitive): MoneyPrimitive {
    this.assertSameCurrency(other);
    return new MoneyPrimitive(
      this.amount + other.amount,
      this.currencyCode,
      this.scale,
    );
  }

  /**
   * Subtract another MoneyPrimitive (must be same currency).
   * Returns a new MoneyPrimitive.
   */
  subtract(other: MoneyPrimitive): MoneyPrimitive {
    this.assertSameCurrency(other);
    return new MoneyPrimitive(
      this.amount - other.amount,
      this.currencyCode,
      this.scale,
    );
  }

  /**
   * Multiply by a scalar factor. Returns a new MoneyPrimitive.
   */
  multiply(factor: number): MoneyPrimitive {
    return new MoneyPrimitive(
      Math.round(this.amount * factor),
      this.currencyCode,
      this.scale,
    );
  }

  // ── Comparison ───────────────────────────────────────────────────────────

  /**
   * Value equality — two MoneyPrimitives are equal if they have the same
   * amount, currency code, and scale.
   */
  equals(other: MoneyPrimitive): boolean {
    return (
      this.amount === other.amount &&
      this.currencyCode === other.currencyCode &&
      this.scale === other.scale
    );
  }

  /**
   * Returns true if this amount is zero.
   */
  isZero(): boolean {
    return this.amount === 0;
  }

  /**
   * Returns true if this amount is negative.
   */
  isNegative(): boolean {
    return this.amount < 0;
  }

  // ── Serialization ────────────────────────────────────────────────────────

  /**
   * Serialize to a plain JSON-compatible object.
   */
  toJSON(): MoneyJSON {
    return {
      amount: this.amount,
      currencyCode: this.currencyCode,
      scale: this.scale,
    };
  }

  toString(): string {
    return `MoneyPrimitive(${this.amount} ${this.currencyCode} scale=${this.scale})`;
  }

  // ── Private Helpers ──────────────────────────────────────────────────────

  private assertSameCurrency(other: MoneyPrimitive): void {
    if (this.currencyCode !== other.currencyCode) {
      throw new Error(
        `Currency mismatch: cannot operate on ${this.currencyCode} and ${other.currencyCode}`,
      );
    }
  }

  /**
   * Resolves the scale (exponent) for a currency code from CURRENCY_MAP.
   * Throws if the currency is not registered.
   */
  private static resolveScale(currencyCode: string): number {
    const currency = CURRENCY_MAP[currencyCode];
    if (!currency) {
      throw new Error(
        `Unknown currency code: ${currencyCode}. Register it first via registerCurrency().`,
      );
    }
    return currency.exponent;
  }
}
