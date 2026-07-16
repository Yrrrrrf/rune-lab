export { default as LanguageSelector } from "./lang/components/LanguageSelector.svelte";
export * from "./lang/mod.ts";
export * from "./money/mod.ts";
export {
  getCurrencyStore,
  getExchangeRateStore,
  getLanguageStore,
  I18nPlugin,
} from "./plugin.ts";
