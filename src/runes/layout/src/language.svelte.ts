// sdk/state/src/language.svelte.ts

import {
  type ConfigStore,
  createConfigStore,
  getLanguageStore,
} from "@rune-lab/kernel";
import type { Language, PersistenceDriver } from "@rune-lab/kernel";
import { resolveDriver } from "@rune-lab/kernel";

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

export interface LanguageStoreOptions {
  driver?: PersistenceDriver | (() => PersistenceDriver | undefined);
  onLocaleChange?: (code: string) => void;
  locales?: readonly string[];
}

export function createLanguageStore(
  options?: LanguageStoreOptions,
): ConfigStore<Language> {
  const driver = resolveDriver(options?.driver);
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

export { getLanguageStore };
