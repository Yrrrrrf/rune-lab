import type { ConfigStore, SlotContext } from "@rune-lab/core";
import { createConfigStore } from "@rune-lab/svelte";
import { createMessageResolver } from "./message-resolver.ts";
import { m } from "./messages.ts";

export interface Language {
  code: string;
  flag?: string;
}

export const getLanguageName: (l: Language) => string = createMessageResolver(
  m,
  {
    keyExtractor: (l: Language) => l.code,
  },
);

export const LANGUAGES = [
  { code: "es", flag: "🇲🇽" },
  { code: "fr", flag: "🇫🇷" },
  { code: "it", flag: "🇮🇹" },
  { code: "pt", flag: "🇧🇷" },
  { code: "en", flag: "🇺🇸" },
  { code: "de", flag: "🇩🇪" },
  { code: "ru", flag: "🇷🇺" },
  { code: "hi", flag: "🇮🇳" },
  { code: "ar", flag: "🇸🇦" },
  { code: "zh", flag: "🇨🇳" },
  { code: "ja", flag: "🇯🇵" },
  { code: "ko", flag: "🇰🇷" },
  { code: "vi", flag: "🇻🇳" },
] as const;

export function createLanguageStore(
  ctx: SlotContext<unknown>,
): ConfigStore<Language, "code"> {
  return createConfigStore<Language, "code">({
    items: LANGUAGES as unknown as Language[],
    storageKey: "language",
    displayName: "Language",
    idKey: "code",
    icon: "🌍",
    driver: ctx.persistence,
  });
}
