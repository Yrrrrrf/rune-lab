// sdk/state/src/composables/useMoney.ts
// Context-aware money composable that reads CurrencyStore + LanguageStore

import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "../context.ts";
import type { ConfigStore } from "../createConfigStore.svelte.ts";
import type { Currency } from "../currency.svelte.ts";
import type { Language } from "../language.svelte.ts";
import {
  addMoney,
  createMoney,
  type Dinero,
  formatMoney,
  type ISO4217Code,
  subtractMoney,
  toMinorUnit,
} from "@internal/core";

/**
 * Context-aware money composable.
 * Reads CurrencyStore and LanguageStore from rune-lab context.
 *
 * Usage:
 *   const { format, toDinero, add, subtract } = useMoney();
 *   const display = format(150.00, undefined, 'major'); // "$150.00"
 */
export function useMoney() {
  const currencyStore = getContext<ConfigStore<Currency>>(
    RUNE_LAB_CONTEXT.currency,
  );
  const languageStore = getContext<ConfigStore<Language>>(
    RUNE_LAB_CONTEXT.language,
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
  ): string {
    if (
      amount === null || amount === undefined ||
      (typeof amount === "number" && isNaN(amount))
    ) {
      return "—";
    }

    const code = currencyCode ?? String(currencyStore.current);
    const locale = String(languageStore.current) || "en";

    const minorAmount = unit === "major"
      ? toMinorUnit(Number(amount), code)
      : amount;

    const money = createMoney(minorAmount, code);
    return formatMoney(money, locale, code);
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

  return { toDinero, format, add, subtract };
}
