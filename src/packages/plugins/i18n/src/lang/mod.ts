import type { LocaleAdapter } from "@rune-lab/core";
import { definePlugin, defineSettings } from "@rune-lab/core";
import { createPluginKit } from "@rune-lab/svelte";
import { Schema } from "effect";
import { createLanguageStore } from "./store.svelte.ts";

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

export const i18nPluginSpec = definePlugin({
  id: "rune-lab.i18n",
  slots: {
    language: {
      create: (ctx: any) => createLanguageStore(ctx),
      contextKey: Symbol.for("rl:language"),
      persist: true,
      config: Schema.Struct({
        defaultLanguage: Schema.optional(Schema.String),
        locales: Schema.optional(Schema.Array(Schema.String)),
      }),
      expose: true,
    },
  },
  settings: defineSettings({
    id: "i18n",
    label: "Language Settings",
    icon: "translate",
    fields: [
      {
        id: "language",
        label: "Language",
        type: "select",
        target: {
          type: "store",
          storeId: "language",
          property: "current",
        },
        options: [
          { value: "en", label: "English" },
          { value: "fr", label: "French" },
          { value: "de", label: "German" },
          { value: "es", label: "Spanish" },
        ],
      },
    ],
  }),
});

const kit = createPluginKit(i18nPluginSpec);

export const I18nPlugin = kit.plugin;
export const { getLanguageStore } = kit.accessors;
