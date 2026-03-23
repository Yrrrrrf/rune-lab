// sdk/state/src/index.ts
// Unified public barrel for @internal/state

// ── Context ───────────────────────────────────────────────────────────────────
export { RUNE_LAB_CONTEXT } from "./context.ts";

// ── Composables ───────────────────────────────────────────────────────────────
export { useRuneLab } from "./composables/useRuneLab.ts";
export type { RuneLabContext } from "./composables/useRuneLab.ts";
export { usePersistence } from "./composables/usePersistence.ts";
export { useMoney } from "./composables/useMoney.ts";

// ── Persistence Drivers ───────────────────────────────────────────────────────
export {
  cookieDriver,
  createCookieDriver,
  createInMemoryDriver,
  inMemoryDriver,
  localStorageDriver,
  sessionStorageDriver,
} from "./persistence/drivers.ts";

// Stores
export {
  type AppData,
  AppStore,
  createAppStore,
  getAppStore,
} from "./app.svelte.ts";

export {
  createLayoutStore,
  getLayoutStore,
  LayoutStore,
  type NavigationItem,
  type NavigationSection,
  type WorkspaceItem,
} from "./layout.svelte.ts";
export {
  ApiStore,
  type ConnectionState,
  createApiStore,
  getApiStore,
} from "./api.svelte.ts";
export {
  createLanguageStore,
  getLanguageStore,
  type Language,
} from "./language.svelte.ts";
export {
  createCurrencyStore,
  type Currency,
  type CurrencyStore,
  type CurrencyStoreOptions,
  getCurrencyStore,
} from "./currency.svelte.ts";
export { createToastStore, getToastStore, ToastStore } from "./toast.svelte.ts";
export {
  type Command,
  CommandStore,
  createCommandStore,
  getCommandStore,
} from "./commands.svelte.ts";
export {
  createShortcutStore,
  getShortcutStore,
  LAYOUT_SHORTCUTS,
  type ShortcutEntry,
  shortcutListener,
  type ShortcutMeta,
  ShortcutStore,
} from "./shortcuts.svelte.ts";
export {
  createThemeStore,
  getThemeStore,
  type Theme,
  type ThemeStoreOptions,
} from "./theme.svelte.ts";
export {
  type ConfigStore,
  type ConfigStoreOptions,
  createConfigStore,
} from "./createConfigStore.svelte.ts";
export { createToastBridge, notify } from "./toast-bridge.ts";
export {
  type CartEntry,
  type CartStore,
  type CartStoreConfig,
  createCartStore,
  getCartStore,
} from "./cart.svelte.ts";

// ── Auth ──────────────────────────────────────────────────────────────────────
export {
  type AuthConfig,
  createSessionStore,
  getSessionStore,
  type Session,
  SessionStore,
  type User,
} from "./auth/index.ts";
