// sdk/state/src/composables/useMoney.ts
// Context-aware money composable that reads CurrencyStore + LanguageStore

import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "../context";
import type { ConfigStore } from "../createConfigStore.svelte";
import type { Currency } from "../currency.svelte";
import type { Language } from "../language.svelte";
import { createMoney, formatMoney, addMoney, subtractMoney, type Dinero } from "@internal/core";

/**
 * Context-aware money composable.
 * Reads CurrencyStore and LanguageStore from rune-lab context.
 *
 * Usage:
 *   const { format, toDinero, add, subtract } = useMoney();
 *   const display = format(15000); // "$150.00" (based on current currency + locale)
 */
export function useMoney() {
    const currencyStore = getContext<ConfigStore<Currency>>(RUNE_LAB_CONTEXT.currency);
    const languageStore = getContext<ConfigStore<Language>>(RUNE_LAB_CONTEXT.language);

    /**
     * Convert minor-unit amount to a Dinero object using current currency
     */
    function toDinero(amount: number, currencyCode?: string): Dinero<number> {
        const code = currencyCode ?? String(currencyStore.current);
        return createMoney(amount, code);
    }

    /**
     * Format an amount (minor units) as a locale-aware currency string
     */
    function format(amount: number, currencyCode?: string): string {
        const code = currencyCode ?? String(currencyStore.current);
        const locale = String(languageStore.current) || "en";
        const money = createMoney(amount, code);
        return formatMoney(money, locale, code);
    }

    /**
     * Add two amounts (minor units) in the current currency
     */
    function add(a: number, b: number, currencyCode?: string): Dinero<number> {
        const code = currencyCode ?? String(currencyStore.current);
        return addMoney(createMoney(a, code), createMoney(b, code));
    }

    /**
     * Subtract two amounts (minor units) in the current currency
     */
    function subtract(a: number, b: number, currencyCode?: string): Dinero<number> {
        const code = currencyCode ?? String(currencyStore.current);
        return subtractMoney(createMoney(a, code), createMoney(b, code));
    }

    return { toDinero, format, add, subtract };
}
