import type { ConfigStore, LocaleAdapter, SlotContext } from "rune-lab/core";
import { createConfigStore } from "rune-lab/ui";
import { createMessageResolver } from "./message-resolver.ts";
import { m } from "./messages.ts";
// @deno-types="./paraglide/runtime.d.ts"
import * as paraglideRuntime from "./paraglide/runtime.js";
import { createParaglideAdapter } from "./paraglide-adapter.ts";

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

type Locale = (typeof paraglideRuntime.locales)[number];

const FLAGS: Record<Locale, string> = {
  es: "🇲🇽",
  fr: "🇫🇷",
  it: "🇮🇹",
  pt: "🇧🇷",
  en: "🇺🇸",
  de: "🇩🇪",
  ru: "🇷🇺",
  hi: "🇮🇳",
  ar: "🇸🇦",
  zh: "🇨🇳",
  ja: "🇯🇵",
  ko: "🇰🇷",
  vi: "🇻🇳",
};

export function createLanguageStore(
  ctx: SlotContext<unknown>,
): ConfigStore<Language, "code"> {
  const localeAdapter: LocaleAdapter = ctx.locale ??
    createParaglideAdapter(paraglideRuntime);

  const availableLocales = localeAdapter.locales ?? paraglideRuntime.locales;

  const items: Language[] = availableLocales.map((code) => ({
    code,
    flag: FLAGS[code as Locale],
  }));

  const store = createConfigStore<Language, "code">({
    items,
    storageKey: "language",
    displayName: "Language",
    idKey: "code",
    icon: "🌍",
    driver: ctx.persistence,
  });

  const originalSet = store.set.bind(store);
  store.set = (code: string) => {
    originalSet(code);
    if (localeAdapter.getLocale() !== code) {
      localeAdapter.setLocale(code);
    }
  };

  if (store.current && localeAdapter.getLocale() !== String(store.current)) {
    localeAdapter.setLocale(String(store.current));
  }

  return store;
}
