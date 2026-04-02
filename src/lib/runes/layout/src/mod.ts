import { defineRune, RUNE_LAB_CONTEXT } from "../../../kernel/src/mod.ts";
import type { PersistenceDriver, RunePlugin } from "../../../kernel/src/mod.ts";
import { createLayoutStore } from "./store.svelte.ts";
import { type Theme, themeStore } from "./theme.svelte.ts";
import { languageStore } from "./language.svelte.ts";

export * from "./store.svelte.ts";
export * from "./types.ts";
export { default as WorkspaceLayout } from "./WorkspaceLayout.svelte";
export * from "./language.svelte.ts";
export * from "./theme.svelte.ts";
export * from "./APP_CONFIGURATIONS.ts";
export * from "./connection-factory.ts";
export { default as LanguageSelector } from "./LanguageSelector.svelte";
export { default as ThemeSelector } from "./ThemeSelector.svelte";
export { default as ResourceSelector } from "./ResourceSelector.svelte";
export { default as AppSettingSelector } from "./AppSettingSelector.svelte";
export { default as NavigationPanel } from "./NavigationPanel.svelte";
export { default as ConnectedNavigationPanel } from "./ConnectedNavigationPanel.svelte";
export { default as WorkspaceStrip } from "./WorkspaceStrip.svelte";
export { default as ContentArea } from "./ContentArea.svelte";
export { default as DetailPanel } from "./DetailPanel.svelte";
export { default as Icon } from "./Icon.svelte";

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
        // FIX: inject the real driver (e.g. localStorageDriver from RuneProvider).
        // The singleton was built at module-load time with createInMemoryDriver(),
        // so without this call every theme change is lost on page reload.
        themeStore.setDriver(driver);

        const c = config as Record<string, unknown>;
        if (c.customThemes) {
          themeStore.addItems(c.customThemes as Theme[]);
        }
        // Only apply defaultTheme when there's no persisted value already loaded
        if (c.defaultTheme && !themeStore.current) {
          if (themeStore.get(c.defaultTheme as never)) {
            themeStore.set(c.defaultTheme as never);
          }
        }
        return themeStore;
      },
    },
    {
      id: "language",
      contextKey: RUNE_LAB_CONTEXT.language,
      factory: (config: unknown, driver: PersistenceDriver) => {
        // FIX: same as theme — swap in the real driver so language choices
        // are persisted to localStorage and survive page reloads.
        languageStore.setDriver(driver);

        const c = config as Record<string, unknown>;
        if (c.locales) {
          const localesToKeep = c.locales as string[];
          languageStore.available = languageStore.available.filter(
            (l) => localesToKeep.includes(l.code),
          );
        }
        return languageStore;
      },
    },
  ],
});