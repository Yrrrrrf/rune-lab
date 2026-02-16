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
export { default as ShortcutPalette } from "./features/shortcuts/ShortcutPalette.svelte";

// Layout
export * from "./layout/index";

// Setting selectors
export { default as AppSettingSelector } from "./features/config/components/AppSettingSelector.svelte";
export { default as ThemeSelector } from "./features/config/components/ThemeSelector.svelte";
export { default as LanguageSelector } from "./features/config/components/LanguageSelector.svelte";
export { default as CurrencySelector } from "./features/config/components/CurrencySelector.svelte";

// ── Stores (individual, for fine-grained imports) ─────────────────────────────
export {
  apiStore,
  appStore,
  commandStore,
  currencyStore,
  languageStore,
  layoutStore,
  shortcutStore,
  themeStore,
  toastStore,
} from "./state/index";

// ^ Showcase
// ^ Showcase
// ^ Showcase
export { default as AppStateInspector } from "./showcase/AppStateInspector.svelte";
export { default as ShowcaseMain } from "./showcase/Showcase.svelte";
export { default as ShowcaseCard } from "./showcase/ShowcaseCard.svelte";

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  AppData,
  Command,
  Currency,
  Language,
  NavigationItem,
  NavigationSection,
  ShortcutEntry,
  Theme,
  WorkspaceItem,
} from "./state/index";

// ── Paraglide compiled messages (re-exported for convenience) ─────────────────
export * as sdkMessages from "./paraglide/messages.js";
