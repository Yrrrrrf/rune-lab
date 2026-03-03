// sdk/core/src/money/money.ts
// Framework-agnostic money utilities using Dinero.js v2
// Consumers should never import Dinero directly — these helpers encapsulate it.

import {
    dinero,
    toDecimal,
    add as dineroAdd,
    subtract as dineroSubtract,
    multiply as dineroMultiply,
    type Dinero,
    type DineroCurrency,
    // ISO 4217 currency definitions
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
 * Create a Dinero monetary value from an amount in minor units (cents)
 * @param amount - Amount in minor units (e.g., 1234 = $12.34 for USD)
 * @param currencyCode - ISO 4217 currency code (e.g., "USD")
 */
export function createMoney(
    amount: number,
    currencyCode: string,
): Dinero<number> {
    const currency = CURRENCY_MAP[currencyCode];
    if (!currency) {
        throw new Error(`Unknown currency code: ${currencyCode}. Add it to CURRENCY_MAP.`);
    }
    return dinero({ amount, currency });
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
        const code =
            currencyCode ??
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
 * Format a raw amount (minor units) as a locale-aware currency string
 * Convenience wrapper around createMoney + formatMoney
 */
export function formatAmount(
    amount: number,
    currencyCode: string,
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
