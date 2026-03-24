import { type Dinero, type ISO4217Code } from "@internal/core";
/**
 * Context-aware money composable.
 * Reads CurrencyStore and LanguageStore from rune-lab context.
 *
 * Usage:
 *   const { format, toDinero, add, subtract, convert } = useMoney();
 *   const display = format(150.00, undefined, 'major'); // "$150.00"
 */
export declare function useMoney(): {
  toDinero: (
    amount: number | null | undefined,
    currencyCode?: ISO4217Code | string,
    unit?: "major" | "minor",
  ) => Dinero<number>;
  format: (
    amount: number | null | undefined,
    currencyCode?: ISO4217Code | string,
    unit?: "major" | "minor",
    localeOverride?: string,
  ) => string;
  add: (
    a: number,
    b: number,
    currencyCode?: ISO4217Code | string,
    unit?: "major" | "minor",
  ) => Dinero<number>;
  subtract: (
    a: number,
    b: number,
    currencyCode?: ISO4217Code | string,
    unit?: "major" | "minor",
  ) => Dinero<number>;
  convert: (
    amount: number,
    fromCode: string,
    unit?: "major" | "minor",
  ) => Dinero<number>;
  formatConverted: (
    amount: number,
    fromCode: string,
    unit?: "major" | "minor",
  ) => string;
  toPayload: (
    amount: number,
    currencyCode?: string,
    target?: "stripe" | "paypal" | "adyen" | "square",
    unit?: "major" | "minor",
  ) => {
    amount: number;
    currency: string;
  } | {
    value: string;
    currency_code: string;
  } | {
    value: number;
    currency: string;
  } | {
    amount: bigint;
    currency: string;
  };
  multiply: (
    amount: number,
    factor: number,
    currencyCode?: ISO4217Code | string,
    unit?: "major" | "minor",
  ) => Dinero<number>;
};
