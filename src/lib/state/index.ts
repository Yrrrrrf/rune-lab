// src/lib/state/index.ts
// Unified public barrel for all application-level state.

// Stores
export {
  type AppData,
  AppStore,
  createAppStore,
  getAppStore,
} from "./app.svelte";

export {
  LayoutStore,
  createLayoutStore,
  getLayoutStore,
  type NavigationItem,
  type NavigationSection,
  type WorkspaceItem,
} from "./layout.svelte";
export { ApiStore, createApiStore, getApiStore } from "./api.svelte";
export {
  type Language,
  createLanguageStore,
  getLanguageStore,
} from "./language.svelte";
export {
  type Currency,
  createCurrencyStore,
  getCurrencyStore,
} from "./currency.svelte";
export { ToastStore, createToastStore, getToastStore } from "./toast.svelte";
export {
  type Command,
  CommandStore,
  createCommandStore,
  getCommandStore,
} from "./commands.svelte";
export {
  shortcutListener,
  ShortcutStore,
  createShortcutStore,
  getShortcutStore,
  type ShortcutEntry,
  type ShortcutMeta,
  LAYOUT_SHORTCUTS,
} from "./shortcuts.svelte";
export { createThemeStore, getThemeStore, type Theme } from "./theme.svelte";
