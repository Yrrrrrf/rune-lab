import { definePlugin } from "@rune-lab/core";
import type { LocaleAdapter, RunePlugin } from "@rune-lab/core";

interface ParaglideRuntime {
  languageTag?(): string;
  setLanguageTag?(locale: string): void;
  onSetLanguageTag?(cb: (locale: string) => void): void;
  getLocale?(): string;
  setLocale?(locale: string): void | Promise<void>;
}

/**
 * Creates a LocaleAdapter that wraps any paraglide runtime.
 * Bridges paraglide tag changes and Svelte stores.
 */
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

/**
 * i18n Plugin — integrates paraglide-js translations with the microkernel.
 */
export const I18nPlugin: RunePlugin = definePlugin({
  id: "rune-lab.i18n",
  stores: [],
});
