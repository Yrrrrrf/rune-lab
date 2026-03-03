// sdk/state/src/index.ts
// Unified public barrel for @internal/state

// ── Context ───────────────────────────────────────────────────────────────────
export { RUNE_LAB_CONTEXT } from "./context";

// ── Composables ───────────────────────────────────────────────────────────────
export { useRuneLab } from "./composables/useRuneLab";
export type { RuneLabContext } from "./composables/useRuneLab";
export { usePersistence } from "./composables/usePersistence";
export { useMoney } from "./composables/useMoney";

// ── Persistence Drivers ───────────────────────────────────────────────────────
export {
  cookieDriver,
  createCookieDriver,
  createInMemoryDriver,
  inMemoryDriver,
  localStorageDriver,
  sessionStorageDriver,
} from "./persistence/drivers";

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
export {
  ApiStore,
  type ConnectionState,
  createApiStore,
  getApiStore,
} from "./api.svelte";
export {
  createLanguageStore,
  getLanguageStore,
  type Language,
} from "./language.svelte";
export {
  createCurrencyStore,
  type Currency,
  type CurrencyStoreOptions,
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
export { createThemeStore, getThemeStore, type Theme, type ThemeStoreOptions } from "./theme.svelte";
export {
  type ConfigItem,
  type ConfigStore,
  type ConfigStoreOptions,
  createConfigStore,
} from "./createConfigStore.svelte";
export { createToastBridge, notify } from "./toast-bridge";
export {
  createCartStore,
  getCartStore,
  type CartStore,
  type CartStoreConfig,
  type CartEntry,
} from "./cart.svelte";
