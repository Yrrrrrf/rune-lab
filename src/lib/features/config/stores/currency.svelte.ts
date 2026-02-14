import { createConfigStore } from "$lib/devtools/createConfigStore.svelte";
/**
 * Currency configuration
 * Based on ISO 4217 currency codes
 */
export interface Currency {
  code: string; // ISO 4217 code (e.g., "USD", "EUR", "MXN")
  symbol: string; // Currency symbol (e.g., "$", "€", "₹")
  decimals: number; // Number of decimal places (usually 2)
}

const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", decimals: 2 },
  { code: "EUR", symbol: "€", decimals: 2 },
  { code: "MXN", symbol: "$", decimals: 2 },
  { code: "CNY", symbol: "¥", decimals: 2 },
  { code: "JPY", symbol: "¥", decimals: 0 },
  { code: "KRW", symbol: "₩", decimals: 0 },
  { code: "AED", symbol: "د.إ", decimals: 2 },
] as const;

export const currencyStore = createConfigStore({
  items: CURRENCIES,
  storageKey: "currency",
  displayName: "Currency",
  idKey: "code",
  icon: "💰",
});

// Usage:
// currencyStore.set("USD")
// currencyStore.getProp("symbol") // "$"
// currencyStore.getProp("decimals") // 2
