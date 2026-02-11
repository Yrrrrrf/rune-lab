// src/lib/features/config/mod.ts
// Central export point for all config-related modules

// Stores
export { themeStore, type Theme } from './theme.svelte.ts';
export { currencyStore, type Currency } from './currency.svelte.ts';
export { languageStore, type Language } from './language.svelte.ts';
export { appStore, type AppData } from './app.svelte.ts';

// Components
export { default as AppSettingSelector } from './AppSettingSelector.svelte';
export { default as ThemeSelector } from './ThemeSelector.svelte';
export { default as CurrencySelector } from './CurrencySelector.svelte';
export { default as LanguageSelector } from './LanguageSelector.svelte';
