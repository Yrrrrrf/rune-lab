// src/lib/composables/useRuneLab.ts
import {
  getApiStore,
  getAppStore,
  getCommandStore,
  getCurrencyStore,
  getLanguageStore,
  getLayoutStore,
  getShortcutStore,
  getThemeStore,
  getToastStore,
} from "$lib/state/index";

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
}

/**
 * Retrieves all Rune Lab stores from the Svelte context tree.
 * Must be called during component initialization (in the `<script>` block).
 */
export function useRuneLab(): RuneLabContext {
  return {
    app: getAppStore(),
    api: getApiStore(),
    toast: getToastStore(),
    theme: getThemeStore(),
    language: getLanguageStore(),
    currency: getCurrencyStore(),
    shortcut: getShortcutStore(),
    layout: getLayoutStore(),
    commands: getCommandStore(),
  };
}
