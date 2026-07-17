import type { LocaleAdapter } from "@rune-lab/core";

interface ParaglideRuntime {
  languageTag?(): string;
  setLanguageTag?(locale: string): void;
  onSetLanguageTag?(cb: (locale: string) => void): void;
  getLocale?(): string;
  setLocale?(locale: string): void | Promise<void>;
}

export function createParaglideAdapter(
  paraglideRuntime: ParaglideRuntime,
): LocaleAdapter {
  return {
    getLocale: () => {
      if (typeof paraglideRuntime.getLocale === "function") {
        return paraglideRuntime.getLocale();
      }
      if (typeof paraglideRuntime.languageTag === "function") {
        return paraglideRuntime.languageTag();
      }
      return "en";
    },
    setLocale: (locale: string) => {
      if (typeof paraglideRuntime.setLocale === "function") {
        return paraglideRuntime.setLocale(locale);
      }
      if (typeof paraglideRuntime.setLanguageTag === "function") {
        return paraglideRuntime.setLanguageTag(locale);
      }
    },
    onChange: (callback: (locale: string) => void) => {
      if (typeof paraglideRuntime.onSetLanguageTag === "function") {
        paraglideRuntime.onSetLanguageTag((tag: string) => callback(tag));
      }
      return () => {};
    },
  };
}

export * from "./message-resolver.ts";
export * from "./messages.ts";
export * from "./store.svelte.ts";
