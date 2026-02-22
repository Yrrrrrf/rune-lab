// src/lib/index.ts
// Public surface of rune-lab.

// ── Devtools utilities ────────────────────────────────────────────────────────
export { createConfigStore } from "./state/createConfigStore.svelte";
export { createMessageResolver } from "./internal/message-resolver";
export { RUNE_LAB_CONTEXT } from "./context";
export type { PersistenceDriver } from "./persistence/types";
export {
  cookieDriver,
  inMemoryDriver,
  localStorageDriver,
  sessionStorageDriver,
} from "./persistence/drivers";

// ── Composables ───────────────────────────────────────────────────────────────
export { type RuneLabContext, useRuneLab } from "./composables/useRuneLab.js";
export { usePersistence } from "./composables/usePersistence.js";

// ── Actions ───────────────────────────────────────────────────────────────────
export { portal } from "./actions/portal";

// ── UI Components ─────────────────────────────────────────────────────────────

// Core primitives
export { default as RuneProvider } from "./components/RuneProvider.svelte";
export { default as Icon } from "./components/Icon.svelte";

// Core overlays
export { default as Toaster } from "./components/Toaster.svelte";
export { default as ApiMonitor } from "./components/ApiMonitor.svelte";
export { default as CommandPalette } from "./features/command-palette/CommandPalette.svelte";
export { default as ShortcutPalette } from "./features/shortcuts/ShortcutPalette.svelte";

// Layout - Dumb Primitives
export {
  default as WorkspaceLayout,
  type WorkspaceLayoutProps,
} from "./layout/WorkspaceLayout.svelte";
export { default as WorkspaceStrip } from "./layout/WorkspaceStrip.svelte";
export { default as NavigationPanel } from "./layout/NavigationPanel.svelte";
export { default as ContentArea } from "./layout/ContentArea.svelte";
export { default as DetailPanel } from "./layout/DetailPanel.svelte";

// Layout - Smart Connected Components
export { default as ConnectedNavigationPanel } from "./features/layout/smart/ConnectedNavigationPanel.svelte";
export { default as ConnectedWorkspaceStrip } from "./features/layout/smart/ConnectedWorkspaceStrip.svelte";

// Setting selectors
export { default as AppSettingSelector } from "./features/config/AppSettingSelector.svelte";
export { default as ThemeSelector } from "./features/config/ThemeSelector.svelte";
export { default as LanguageSelector } from "./features/config/LanguageSelector.svelte";
export { default as CurrencySelector } from "./features/config/CurrencySelector.svelte";

// ── Stores ────────────────────────────────────────────────────────────────────
export {
  createApiStore,
  createAppStore,
  createCommandStore,
  createCurrencyStore,
  createLanguageStore,
  createLayoutStore,
  createShortcutStore,
  createThemeStore,
  createToastBridge,
  createToastStore,
  getApiStore,
  getAppStore,
  getCommandStore,
  getCurrencyStore,
  getLanguageStore,
  getLayoutStore,
  getShortcutStore,
  getThemeStore,
  getToastStore,
  notify,
} from "./state/index";

export { default as AppStateInspector } from "./showcase/AppStateInspector.svelte";

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  AppData,
  Command,
  ConfigStore,
  Currency,
  Language,
  NavigationItem,
  NavigationSection,
  ShortcutEntry,
  Theme,
  WorkspaceItem,
} from "./state/index";

export type { ConnectionState } from "./state/api.svelte";

// ── Paraglide compiled messages ───────────────────────────────────────────────
export * as sdkMessages from "./paraglide/messages.js";
