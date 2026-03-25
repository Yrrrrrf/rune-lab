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
  type SessionStore,
} from "../../../mod.ts";
import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "@rune-lab/kernel";

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
export function useRuneLab(): RuneLabContext {
  // Session is optional — only present when auth is enabled
  let session: SessionStore | undefined;
  try {
    session = getContext<SessionStore>(RUNE_LAB_CONTEXT.session);
  } catch {
    // Auth not enabled — session stays undefined
  }

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
    session,
  };
}
