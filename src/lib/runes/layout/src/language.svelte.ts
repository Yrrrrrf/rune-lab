// sdk/state/src/language.svelte.ts

import {
  type ConfigStore,
  createConfigStore,
  getLanguageStore,
} from "../../../kernel/src/mod.ts";
import type { Language } from "../../../kernel/src/mod.ts";

export type { Language };

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

export const languageStore: ConfigStore<Language> = createConfigStore<Language>(
  {
    items: LANGUAGES,
    storageKey: "language",
    displayName: "Language",
    idKey: "code",
    icon: "🌍",
  },
);

export type LanguageStore = ReturnType<typeof createConfigStore<Language>>;
export { getLanguageStore };
