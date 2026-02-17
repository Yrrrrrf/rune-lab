// client/sdk/state/src/config/language.svelte.ts

import { createConfigStore } from "$lib/devtools/createConfigStore.svelte";
import { setLocale } from "$lib/paraglide/runtime.js";

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

export const languageStore = createConfigStore<Language>({
  items: LANGUAGES,
  storageKey: "language",
  displayName: "Language",
  idKey: "code",
  icon: "🌍",
});

// Sync Paraglide locale with languageStore
if (typeof window !== "undefined") {
  $effect.root(() => {
    $effect(() => {
      const currentCode = languageStore.current as string;
      setLocale(currentCode as any);
    });
  });
}
