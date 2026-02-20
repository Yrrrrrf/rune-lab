// src/lib/config.ts
// Unified facade over all app-level stores.
// Updated for SSR safety: Re-exports factories for context-aware stores.

export { AppStore, createAppStore, getAppStore } from "./state/app.svelte";

export {
  createLayoutStore,
  getLayoutStore,
  LayoutStore,
} from "./state/layout.svelte";

export {
  type Command,
  CommandStore,
  createCommandStore,
  getCommandStore,
} from "./state/commands.svelte";

// These stores are factories now
export {
  createApiStore,
  getApiStore,
  createCurrencyStore,
  getCurrencyStore,
  createLanguageStore,
  getLanguageStore,
  createThemeStore,
  getThemeStore,
  createToastStore,
  getToastStore,
  createShortcutStore,
  getShortcutStore,
} from "./state/index";

