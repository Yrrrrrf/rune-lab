import { type ConfigStore } from "./createConfigStore.svelte.ts";
/**
 * Language configuration
 * Represents a supported language in the application
 */
export interface Language {
  code: string;
  flag?: string;
}
export declare const LANGUAGES: readonly [{
  readonly code: "es";
  readonly flag: "🇲🇽";
}, {
  readonly code: "fr";
  readonly flag: "🇫🇷";
}, {
  readonly code: "it";
  readonly flag: "🇮🇹";
}, {
  readonly code: "pt";
  readonly flag: "🇧🇷";
}, {
  readonly code: "en";
  readonly flag: "🇺🇸";
}, {
  readonly code: "de";
  readonly flag: "🇩🇪";
}, {
  readonly code: "ru";
  readonly flag: "🇷🇺";
}, {
  readonly code: "hi";
  readonly flag: "🇮🇳";
}, {
  readonly code: "ar";
  readonly flag: "🇸🇦";
}, {
  readonly code: "zh";
  readonly flag: "🇨🇳";
}, {
  readonly code: "ja";
  readonly flag: "🇯🇵";
}, {
  readonly code: "ko";
  readonly flag: "🇰🇷";
}, {
  readonly code: "vi";
  readonly flag: "🇻🇳";
}];
import type { PersistenceDriver } from "@internal/core";
export interface LanguageStoreOptions {
  driver?: PersistenceDriver | (() => PersistenceDriver | undefined);
  onLocaleChange?: (code: string) => void;
  locales?: readonly string[];
}
export declare function createLanguageStore(
  options?: LanguageStoreOptions,
): ConfigStore<Language>;
export declare function getLanguageStore(): ConfigStore<Language>;
