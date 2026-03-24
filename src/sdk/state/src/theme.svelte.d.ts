import { type ConfigStore } from "./createConfigStore.svelte.ts";
export interface Theme {
  name: string;
  icon: string;
}
import type { PersistenceDriver } from "@internal/core";
export interface ThemeStoreOptions {
  driver?: PersistenceDriver | (() => PersistenceDriver | undefined);
  /** Additional custom themes to append to the built-in DaisyUI set */
  customThemes?: Theme[];
  /** Fallback theme if no persisted value exists (after system preference check) */
  defaultTheme?: string;
}
export declare function createThemeStore(
  driverOrOptions?:
    | PersistenceDriver
    | (() => PersistenceDriver | undefined)
    | ThemeStoreOptions,
): ConfigStore<Theme>;
export declare function getThemeStore(): ConfigStore<Theme>;
