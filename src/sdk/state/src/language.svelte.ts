// sdk/state/src/language.svelte.ts

import {
  type ConfigStore,
  createConfigStore,
} from "./createConfigStore.svelte.ts";
import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "./context.ts";

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

import type { PersistenceDriver } from "@internal/core";

export interface LanguageStoreOptions {
  driver?: PersistenceDriver | (() => PersistenceDriver | undefined);
  onLocaleChange?: (code: string) => void;
  locales?: readonly string[];
}

export function createLanguageStore(options?: LanguageStoreOptions) {
  const driver = typeof options?.driver === "function"
    ? options.driver()
    : options?.driver;
  const items = options?.locales
    ? LANGUAGES.filter((l) => options.locales!.includes(l.code))
    : LANGUAGES;

  const store = createConfigStore<Language>({
    items,
    storageKey: "language",
    displayName: "Language",
    idKey: "code",
    icon: "🌍",
    driver,
  });

  return store;
}

export function getLanguageStore() {
  return getContext<ConfigStore<Language>>(RUNE_LAB_CONTEXT.language);
}
