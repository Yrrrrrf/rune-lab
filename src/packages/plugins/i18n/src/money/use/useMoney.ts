import type { ConfigStore } from "@rune-lab/svelte";
import { getContext } from "svelte";
import type { CurrencyStore } from "../stores/currency.svelte.ts";
import type { ExchangeRateStore } from "../stores/exchange-rate.svelte.ts";
import { MONEY_CONTEXT } from "../mod.ts";
import type { Dinero, ISO4217Code } from "../primitives/money.ts";
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
} from "../primitives/money.ts";

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

function getMinorAmount(
  amount: number | null | undefined,
  code: string,
  unit: "major" | "minor",
): number | null | undefined {
  return unit === "major" && amount !== null && amount !== undefined
    ? toMinorUnit(Number(amount), code)
    : amount;
}

export function useMoney(): UseMoneyReturn {
  const currencyStore = getContext<CurrencyStore>(MONEY_CONTEXT.currency);
  if (!currencyStore) {
    throw new Error(
      "[rune-lab] useMoney() found no CurrencyStore. Did you register MoneyPlugin in <RuneProvider plugins={[…]}>?",
    );
  }
  const languageStore = getContext<
    ConfigStore<Record<string, unknown>, string>
  >(Symbol.for("rl:language"));
  if (!languageStore) {
    throw new Error(
      "[rune-lab] useMoney() found no LanguageStore. Did you register I18nPlugin in <RuneProvider plugins={[…]}>?",
    );
  }
  const exchangeRateStore = getContext<ExchangeRateStore>(
    MONEY_CONTEXT.exchangeRate,
  );
  if (!exchangeRateStore) {
    throw new Error(
      "[rune-lab] useMoney() found no ExchangeRateStore. Did you register MoneyPlugin in <RuneProvider plugins={[…]}>?",
    );
  }

  function toDinero(
    amount: number | null | undefined,
    currencyCode?: ISO4217Code | string,
    unit: "major" | "minor" = "minor",
  ): Dinero<number> {
    const code = currencyCode ?? String(currencyStore.current);
    const minorAmount = getMinorAmount(amount, code, unit);
    return createMoney(minorAmount, code);
  }

  function format(
    amount: number | null | undefined,
    currencyCode?: ISO4217Code | string,
    unit: "major" | "minor" = "minor",
    localeOverride?: string,
  ): string {
    if (
      amount === null ||
      amount === undefined ||
      (typeof amount === "number" && isNaN(amount))
    ) {
      return "—";
    }

    const code = currencyCode ?? String(currencyStore.current);
    const locale = localeOverride ?? (String(languageStore.current) || "en");
    const minorAmount = getMinorAmount(amount, code, unit);
    const money = createMoney(minorAmount, code);
    return formatMoney(money, locale, code);
  }

  function convert(
    amount: number,
    fromCode: string,
    unit: "major" | "minor" = "minor",
  ): Dinero<number> {
    const minorAmount = getMinorAmount(amount, fromCode, unit);
    const currentCode = String(currencyStore.current);

    if (!exchangeRateStore?.hasRates || fromCode === currentCode) {
      return createMoney(minorAmount, fromCode);
    }

    const sourceMoney = createMoney(minorAmount, fromCode);
    return convertMoney(sourceMoney, currentCode, exchangeRateStore.rates);
  }

  function formatConverted(
    amount: number,
    fromCode: string,
    unit: "major" | "minor" = "minor",
  ): string {
    const money = convert(amount, fromCode, unit);
    const locale = String(languageStore.current) || "en";
    const currentCode = String(currencyStore.current);
    const snapshot = toMoneySnapshot(money);

    const displayCode = exchangeRateStore?.hasRates
      ? currentCode
      : snapshot.currency;

    return formatMoney(money, locale, displayCode);
  }

  function multiply(
    amount: number,
    factor: number,
    currencyCode?: ISO4217Code | string,
    unit: "major" | "minor" = "minor",
  ): Dinero<number> {
    const money = toDinero(amount, currencyCode, unit);
    return multiplyMoney(money, factor);
  }

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

  function resolveOperands(
    a: number,
    b: number,
    currencyCode?: ISO4217Code | string,
    unit: "major" | "minor" = "minor",
  ) {
    const code = currencyCode ?? String(currencyStore.current);
    return [toDinero(a, code, unit), toDinero(b, code, unit)] as const;
  }

  function add(
    a: number,
    b: number,
    currencyCode?: ISO4217Code | string,
    unit: "major" | "minor" = "minor",
  ): Dinero<number> {
    const [aMoney, bMoney] = resolveOperands(a, b, currencyCode, unit);
    return addMoney(aMoney, bMoney);
  }

  function subtract(
    a: number,
    b: number,
    currencyCode?: ISO4217Code | string,
    unit: "major" | "minor" = "minor",
  ): Dinero<number> {
    const [aMoney, bMoney] = resolveOperands(a, b, currencyCode, unit);
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
