import { createConfigStore } from "rune-lab";
import type { ConfigStore, LocaleAdapter, SlotContext } from "rune-lab/core";
import { createMessageResolver } from "./message-resolver.ts";
import { m } from "./messages.ts";
import { createParaglideAdapter } from "./paraglide-adapter.ts";
// @deno-types="./paraglide/runtime.d.ts"
import * as paraglideRuntime from "./paraglide/runtime.js";

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
  const store = createConfigStore<Language, "code">({
    items: LANGUAGES as unknown as Language[],
    storageKey: "language",
    displayName: "Language",
    idKey: "code",
    icon: "🌍",
    driver: ctx.persistence,
  });

  // The plugin owns the paraglide call directly: it builds its own adapter
  // from the generated runtime when the app doesn't supply one, so language
  // switching works without the app author having to remember to wire
  // `localeAdapter` into RuneProvider. An explicit `ctx.locale` still wins,
  // for consumers who want to supply their own.
  const locale: LocaleAdapter = ctx.locale ??
    createParaglideAdapter(paraglideRuntime);

  const originalSet = store.set.bind(store);
  store.set = (code: string) => {
    originalSet(code);
    try {
      locale.setLocale(code);
    } catch (err) {
      console.error("[i18n] Failed to update locale:", err);
    }
  };

  if (store.current) {
    try {
      locale.setLocale(String(store.current));
    } catch (err) {
      console.error("[i18n] Failed to set initial locale:", err);
    }
  }

  return store;
}
