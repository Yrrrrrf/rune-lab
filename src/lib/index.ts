// src/lib/index.ts
// Public surface of rune-lab.

// ── Devtools utilities ────────────────────────────────────────────────────────
export { createConfigStore } from "./devtools/createConfigStore.svelte";
export { createMessageResolver } from "./devtools/message-resolver";

// ── Actions ───────────────────────────────────────────────────────────────────
export { portal } from "./actions/portal";

// ── UI Components ─────────────────────────────────────────────────────────────

// Core primitives
export { default as Icon } from "./components/Icon.svelte";

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

// ── Stores ────────────────────────────────────────────────────────────────────
export {
  apiStore,
  createAppStore,
  createCommandStore,
  createLayoutStore,
  currencyStore,
  getAppStore,
  getCommandStore,
  getLayoutStore,
  languageStore,
  shortcutStore,
  themeStore,
  toastStore,
} from "./state/index";

// ── Showcase ──────────────────────────────────────────────────────────────────
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

// ── Paraglide compiled messages ───────────────────────────────────────────────
export * as sdkMessages from "./paraglide/messages.js";
