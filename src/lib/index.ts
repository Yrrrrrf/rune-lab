// src/lib/index.ts
// Public surface of rune-lab.
// Components, devtools utilities, and store types — but NOT appConfig.
// For the unified config facade see: rune-lab/config  (src/lib/config.ts)

// ── Devtools utilities ────────────────────────────────────────────────────────
export { createConfigStore } from "./devtools/createConfigStore.svelte";
export { createMessageResolver } from "./devtools/message-resolver";

// ── UI Components ─────────────────────────────────────────────────────────────

// Core overlays
export { default as Toaster } from "./devtools/Toaster.svelte";
export { default as ApiMonitor } from "./devtools/API_Monitor.svelte";
export { default as CommandPalette } from "./features/command-palette/CommandPalette.svelte";

// Setting selectors
export { default as AppSettingSelector } from "./features/config/components/AppSettingSelector.svelte";
export { default as ThemeSelector } from "./features/config/components/ThemeSelector.svelte";
export { default as LanguageSelector } from "./features/config/components/LanguageSelector.svelte";
export { default as CurrencySelector } from "./features/config/components/CurrencySelector.svelte";

// ── Stores (individual, for fine-grained imports) ─────────────────────────────
export { appStore } from "./features/config/stores/app.svelte";
export { apiStore } from "./features/config/stores/api.svelte";
export { toastStore } from "./features/config/stores/toast.svelte";
export { commandStore } from "./features/command-palette/commands.svelte";
export { themeStore } from "./features/config/stores/theme.svelte";
export { languageStore } from "./features/config/stores/language.svelte";
export { currencyStore } from "./features/config/stores/currency.svelte";

// ^ Showcase
// ^ Showcase
// ^ Showcase
export { default as AppStateInspector } from "./showcase/AppStateInspector.svelte";

// ── Types ─────────────────────────────────────────────────────────────────────
export type { AppData } from "./features/config/stores/app.svelte";
export type { Command } from "./features/command-palette/commands.svelte";
export type { Currency } from "./features/config/stores/currency.svelte";
export type { Language } from "./features/config/stores/language.svelte";
export type { Theme } from "./features/config/stores/theme.svelte";

// ── Paraglide compiled messages (re-exported for convenience) ─────────────────
export * as sdkMessages from "./paraglide/messages.js";
