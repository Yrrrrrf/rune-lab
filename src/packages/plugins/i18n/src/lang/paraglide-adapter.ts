import type { LocaleAdapter } from "rune-lab/core";

export interface ParaglideRuntime {
  locales?: readonly string[];
  getLocale?(): string;
  setLocale?(locale: string): void | Promise<void>;
}

export function createParaglideAdapter(
  paraglideRuntime: ParaglideRuntime,
): LocaleAdapter {
  return {
    locales: paraglideRuntime.locales ?? ["en"],
    getLocale: () => {
      if (typeof paraglideRuntime.getLocale === "function") {
        return paraglideRuntime.getLocale();
      }
      return "en";
    },
    setLocale: (locale: string) => {
      if (typeof paraglideRuntime.setLocale === "function") {
        return paraglideRuntime.setLocale(locale);
      }
    },
    onChange: () => () => {},
  };
}
