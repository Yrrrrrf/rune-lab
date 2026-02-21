// client/sdk/state/src/config/language.svelte.ts

import {
  type ConfigStore,
  createConfigStore,
} from "$lib/devtools/createConfigStore.svelte";
import { setLocale } from "$lib/paraglide/runtime.js";
import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "$lib/context";

/**
 * Language configuration
 * Represents a supported language in the application
 */
export interface Language {
  code: string; // ISO 639-1 (e.g., "en", "es", "fr")
  flag?: string; // Emoji flag or icon
}

export const LANGUAGES = [
  // --- INDOEUROPEAS (Rama Romance / Latín) ---
  { code: "es", flag: "🇲🇽" },
  { code: "fr", flag: "🇫🇷" },
  { code: "it", flag: "🇮🇹" },
  { code: "pt", flag: "🇧🇷" },
  // --- INDOEUROPEAS (Rama Germánica) ---
  { code: "en", flag: "🇺🇸" },
  { code: "de", flag: "🇩🇪" },
  // --- INDOEUROPEAS (Otras Ramas) ---
  { code: "ru", flag: "🇷🇺" },
  { code: "hi", flag: "🇮🇳" },
  // --- AFROASIÁTICAS ---
  { code: "ar", flag: "🇸🇦" },
  // --- FAMILIAS ASIÁTICAS INDEPENDIENTES ---
  { code: "zh", flag: "🇨🇳" },
  { code: "ja", flag: "🇯🇵" },
  { code: "ko", flag: "🇰🇷" },
  { code: "vi", flag: "🇻🇳" },
] as const;

import type { PersistenceDriver } from "$lib/persistence/types";

export function createLanguageStore(
  driver?: PersistenceDriver | (() => PersistenceDriver | undefined),
) {
  const store = createConfigStore<Language>({
    items: LANGUAGES,
    storageKey: "language",
    displayName: "Language",
    idKey: "code",
    icon: "🌍",
    driver: typeof driver === "function" ? driver() : driver,
  });

  // Sync Paraglide locale with languageStore
  if (typeof window !== "undefined") {
    $effect.root(() => {
      $effect(() => {
        const currentCode = store.current as string;
        setLocale(currentCode as any);
      });
    });
  }

  return store;
}

export function getLanguageStore() {
  return getContext<ConfigStore<Language>>(RUNE_LAB_CONTEXT.language);
}
