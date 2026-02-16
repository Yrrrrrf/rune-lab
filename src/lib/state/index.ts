// src/lib/state/index.ts
// Unified public barrel for all application-level state.

export { type AppData, appStore } from "./app.svelte";
export { apiStore } from "./api.svelte";
export { type Theme, themeStore } from "./theme.svelte";
export { type Language, languageStore } from "./language.svelte";
export { type Currency, currencyStore } from "./currency.svelte";
export { toastStore } from "./toast.svelte";
export { type Command, commandStore } from "./commands.svelte";
export {
  LAYOUT_SHORTCUTS,
  type ShortcutEntry,
  shortcutStore,
} from "./shortcuts.svelte";
export {
  layoutStore,
  type NavigationItem,
  type NavigationSection,
  type WorkspaceItem,
} from "./layout.svelte";
