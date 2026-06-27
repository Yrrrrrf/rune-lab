// sdk/state/src/language.svelte.ts

import {
  createConfigStore,
  getLanguageStore,
} from "../../../kernel/src/mod.ts";
import type { Language } from "../../../kernel/src/mod.ts";
import { createMessageResolver } from "../../../i18n/message-resolver.ts";
import { m } from "../../../i18n/messages.ts";

export type { Language };

/**
 * Resolver to get the display name of a language in the current locale
 */
export const getLanguageName = createMessageResolver<Language>(m, {
  keyExtractor: (l) => l.code,
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

export const languageStore = createConfigStore<Language, "code">({
  items: LANGUAGES,
  storageKey: "language",
  displayName: "Language",
  idKey: "code",
  icon: "🌍",
});

export type LanguageStore = ReturnType<
  typeof createConfigStore<Language, "code">
>;
export { getLanguageStore };
