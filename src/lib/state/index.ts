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
  createLayoutStore,
  getLayoutStore,
  LayoutStore,
  type NavigationItem,
  type NavigationSection,
  type WorkspaceItem,
} from "./layout.svelte";
export { ApiStore, createApiStore, getApiStore } from "./api.svelte";
export {
  createLanguageStore,
  getLanguageStore,
  type Language,
} from "./language.svelte";
export {
  createCurrencyStore,
  type Currency,
  getCurrencyStore,
} from "./currency.svelte";
export { createToastStore, getToastStore, ToastStore } from "./toast.svelte";
export {
  type Command,
  CommandStore,
  createCommandStore,
  getCommandStore,
} from "./commands.svelte";
export {
  createShortcutStore,
  getShortcutStore,
  LAYOUT_SHORTCUTS,
  type ShortcutEntry,
  shortcutListener,
  type ShortcutMeta,
  ShortcutStore,
} from "./shortcuts.svelte";
export { createThemeStore, getThemeStore, type Theme } from "./theme.svelte";
