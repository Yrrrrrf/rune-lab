import type {
  getApiStore,
  getAppStore,
  getCommandStore,
  getCurrencyStore,
  getLanguageStore,
  getLayoutStore,
  getShortcutStore,
  getThemeStore,
  getToastStore,
  SessionStore,
} from "../index.ts";
export interface RuneLabContext {
  app: ReturnType<typeof getAppStore>;
  api: ReturnType<typeof getApiStore>;
  toast: ReturnType<typeof getToastStore>;
  theme: ReturnType<typeof getThemeStore>;
  language: ReturnType<typeof getLanguageStore>;
  currency: ReturnType<typeof getCurrencyStore>;
  shortcut: ReturnType<typeof getShortcutStore>;
  layout: ReturnType<typeof getLayoutStore>;
  commands: ReturnType<typeof getCommandStore>;
  /** Available when auth is enabled in RuneProvider config */
  session?: SessionStore;
}
/**
 * Retrieves all Rune Lab stores from the Svelte context tree.
 * Must be called during component initialization (in the `<script>` block).
 */
export declare function useRuneLab(): RuneLabContext;
