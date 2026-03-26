// sdk/state/src/composables/useMoney.ts
// Context-aware money composable that reads CurrencyStore + LanguageStore

import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "@rune-lab/kernel";
import type { ConfigStore } from "@rune-lab/kernel";
import {
  addMoney,
  convertMoney,
  createMoney,
  formatMoney,
  multiplyMoney,
  subtractMoney,
  toAdyenMoney,
  toMinorUnit,
  toMoneySnapshot,
  toPaypalMoney,
  toSquareMoney,
  toStripeMoney,
} from "@rune-lab/money";
import type {
  CurrencyStore,
  Dinero,
  ExchangeRateStore,
  ISO4217Code,
} from "@rune-lab/money";

export interface UseMoneyReturn {
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
  ) =>
    | { amount: number; currency: string }
    | { value: string; currency_code: string }
    | { value: number; currency: string }
    | { amount: bigint; currency: string };
  multiply: (
    amount: number,
    factor: number,
    currencyCode?: ISO4217Code | string,
    unit?: "major" | "minor",
  ) => Dinero<number>;
}

/**
 * Context-aware money composable.
 * Reads CurrencyStore and LanguageStore from rune-lab context.
 *
 * Usage:
 *   const { format, toDinero, add, subtract, convert } = useMoney();
 *   const display = format(150.00, undefined, 'major'); // "$150.00"
 */
export function useMoney(): UseMoneyReturn {
  const currencyStore = getContext<CurrencyStore>(RUNE_LAB_CONTEXT.currency);
  const languageStore = getContext<ConfigStore<unknown>>(
    RUNE_LAB_CONTEXT.language,
  );
  const exchangeRateStore = getContext<ExchangeRateStore>(
    RUNE_LAB_CONTEXT.exchangeRate,
  );

  /**
   * Convert amount to a Dinero object using current currency
   */
  function toDinero(
    amount: number | null | undefined,
    currencyCode?: ISO4217Code | string,
    unit: "major" | "minor" = "minor",
  ): Dinero<number> {
    const code = currencyCode ?? String(currencyStore.current);
    const minorAmount =
      unit === "major" && amount !== null && amount !== undefined
        ? toMinorUnit(Number(amount), code)
        : amount;
    return createMoney(minorAmount, code);
  }

  /**
   * Format an amount as a locale-aware currency string
   */
  function format(
    amount: number | null | undefined,
    currencyCode?: ISO4217Code | string,
    unit: "major" | "minor" = "minor",
    localeOverride?: string,
  ): string {
    if (
      amount === null || amount === undefined ||
      (typeof amount === "number" && isNaN(amount))
    ) {
      return "—";
    }

    const code = currencyCode ?? String(currencyStore.current);
    const locale = localeOverride ?? (String(languageStore.current) || "en");

    const minorAmount = unit === "major"
      ? toMinorUnit(Number(amount), code)
      : amount;

    const money = createMoney(minorAmount, code);
    return formatMoney(money, locale, code);
  }

  /**
   * Converts an amount from fromCode to the current display currency.
   */
  function convert(
    amount: number,
    fromCode: string,
    unit: "major" | "minor" = "minor",
  ): Dinero<number> {
    const minorAmount = unit === "major"
      ? toMinorUnit(amount, fromCode)
      : amount;
    const currentCode = String(currencyStore.current);

    if (!exchangeRateStore?.hasRates || fromCode === currentCode) {
      return createMoney(minorAmount, fromCode);
    }

    const sourceMoney = createMoney(minorAmount, fromCode);
    return convertMoney(sourceMoney, currentCode, exchangeRateStore.rates);
  }

  /**
   * Convenience: converts and formats an amount in one go.
   */
  function formatConverted(
    amount: number,
    fromCode: string,
    unit: "major" | "minor" = "minor",
  ): string {
    const money = convert(amount, fromCode, unit);
    const locale = String(languageStore.current) || "en";
    const currentCode = String(currencyStore.current);
    const snapshot = toMoneySnapshot(money);

    // If conversion didn't happen (no rates), format as original currency
    const displayCode = exchangeRateStore?.hasRates
      ? currentCode
      : snapshot.currency;

    return formatMoney(money, locale, displayCode);
  }

  /**
   * Multiply an amount by a factor.
   */
  function multiply(
    amount: number,
    factor: number,
    currencyCode?: ISO4217Code | string,
    unit: "major" | "minor" = "minor",
  ): Dinero<number> {
    const money = toDinero(amount, currencyCode, unit);
    return multiplyMoney(money, factor);
  }

  /**
   * Format an amount for a specific payment provider payload.
   */
  function toPayload(
    amount: number,
    currencyCode?: string,
    target: "stripe" | "paypal" | "adyen" | "square" = "stripe",
    unit: "major" | "minor" = "minor",
  ) {
    const code = currencyCode ?? String(currencyStore.current);
    const money = toDinero(amount, code, unit);

    switch (target) {
      case "stripe":
        return toStripeMoney(money);
      case "paypal":
        return toPaypalMoney(money);
      case "adyen":
        return toAdyenMoney(money);
      case "square":
        return toSquareMoney(money);
      default:
        return toStripeMoney(money);
    }
  }

  /**
   * Add two amounts in the current currency
   */
  function add(
    a: number,
    b: number,
    currencyCode?: ISO4217Code | string,
    unit: "major" | "minor" = "minor",
  ): Dinero<number> {
    const code = currencyCode ?? String(currencyStore.current);
    const aMoney = toDinero(a, code, unit);
    const bMoney = toDinero(b, code, unit);
    return addMoney(aMoney, bMoney);
  }

  /**
   * Subtract two amounts in the current currency
   */
  function subtract(
    a: number,
    b: number,
    currencyCode?: ISO4217Code | string,
    unit: "major" | "minor" = "minor",
  ): Dinero<number> {
    const code = currencyCode ?? String(currencyStore.current);
    const aMoney = toDinero(a, code, unit);
    const bMoney = toDinero(b, code, unit);
    return subtractMoney(aMoney, bMoney);
  }

  return {
    toDinero,
    format,
    add,
    subtract,
    convert,
    formatConverted,
    toPayload,
    multiply,
  };
}
