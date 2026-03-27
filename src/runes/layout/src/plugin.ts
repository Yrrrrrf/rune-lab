import { defineRune, RUNE_LAB_CONTEXT } from "@rune-lab/kernel";
import type { PersistenceDriver, RunePlugin } from "@rune-lab/kernel";
import { createLayoutStore } from "./store.svelte.ts";
import { createThemeStore, type Theme } from "./theme.svelte.ts";
import { createLanguageStore } from "./language.svelte.ts";

/**
 * Layout Plugin — manages the primary workspace layout, theme, and language.
 * Always included by default in RuneProvider.
 */
export const LayoutPlugin: RunePlugin = defineRune({
  id: "rune-lab.layout",
  stores: [
    {
      id: "layout",
      contextKey: RUNE_LAB_CONTEXT.layout,
      factory: (_config: unknown, driver: PersistenceDriver) =>
        createLayoutStore(driver),
    },
    {
      id: "theme",
      contextKey: RUNE_LAB_CONTEXT.theme,
      factory: (config: unknown, driver: PersistenceDriver) => {
        const c = config as Record<string, unknown>;
        return createThemeStore({
          driver,
          customThemes: c.customThemes as Theme[], // daisyui theme type is complex
          defaultTheme: c.defaultTheme as string,
        });
      },
    },
    {
      id: "language",
      contextKey: RUNE_LAB_CONTEXT.language,
      factory: (config: unknown, driver: PersistenceDriver) => {
        const c = config as Record<string, unknown>;
        return createLanguageStore({
          driver,
          locales: c.locales as string[],
        });
      },
    },
  ],
});
