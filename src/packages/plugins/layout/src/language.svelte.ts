// sdk/state/src/language.svelte.ts

import { type ConfigStore, createConfigStore } from "@rune-lab/svelte";
import type { Language } from "./types.ts";
import { createMessageResolver, m } from "rune-lab/i18n/lang";

/**
 * Resolver to get the display name of a language in the current locale
 */
export const getLanguageName: (l: Language) => string = createMessageResolver<
  Language
>(m, {
  keyExtractor: (l: Language) => l.code,
});

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

export const languageStore: ConfigStore<Language, "code"> = createConfigStore<
  Language,
  "code"
>({
  items: LANGUAGES,
  storageKey: "language",
  displayName: "Language",
  idKey: "code",
  icon: "🌍",
});

export type LanguageStore = ReturnType<
  typeof createConfigStore<Language, "code">
>;
