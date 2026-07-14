import type {
  ConfigStore,
  PersistenceDriver,
  RunePlugin,
} from "@rune-lab/svelte";
import { createAccessor, definePlugin } from "@rune-lab/svelte";
import GeneralSettings from "./GeneralSettings.svelte";
import { languageStore } from "./language.svelte.ts";
import { createLayoutStore, type LayoutStore } from "./store.svelte.ts";
import { themeStore } from "./theme.svelte.ts";
import type { Language, Theme } from "./types.ts";

export const LAYOUT_CONTEXT: {
  layout: symbol;
  theme: symbol;
  language: symbol;
} = {
  layout: Symbol("rl:layout"),
  theme: Symbol("rl:theme"),
  language: Symbol("rl:language"),
};

export const getLayoutStore: () => LayoutStore = createAccessor<LayoutStore>(
  LAYOUT_CONTEXT.layout,
  "getLayoutStore()",
  "LayoutStore",
  "LayoutPlugin",
);

export const getLanguageStore: () => ConfigStore<Language, "code"> =
  createAccessor<ConfigStore<Language, "code">>(
    LAYOUT_CONTEXT.language,
    "getLanguageStore()",
    "LanguageStore",
    "LayoutPlugin",
  );

export const getThemeStore: () => ConfigStore<Theme, "name"> = createAccessor<
  ConfigStore<Theme, "name">
>(LAYOUT_CONTEXT.theme, "getThemeStore()", "ThemeStore", "LayoutPlugin");

export * from "./APP_CONFIGURATIONS.ts";
export { default as AppSettingSelector } from "./AppSettingSelector.svelte";
export { default as ConnectedNavigationPanel } from "./ConnectedNavigationPanel.svelte";
export { default as ContentArea } from "./ContentArea.svelte";
export * from "./connection-factory.ts";
export { default as DetailPanel } from "./DetailPanel.svelte";
export { default as GeneralSettings } from "./GeneralSettings.svelte";
export { default as Icon } from "./Icon.svelte";
export { default as LanguageSelector } from "./LanguageSelector.svelte";
export * from "./language.svelte.ts";
export { default as NavigationPanel } from "./NavigationPanel.svelte";
export { default as ResourceSelector } from "./ResourceSelector.svelte";
export * from "./store.svelte.ts";
export { default as ThemeSelector } from "./ThemeSelector.svelte";
export * from "./theme.svelte.ts";
export * from "./types.ts";
export { default as WorkspaceLayout } from "./WorkspaceLayout.svelte";
export { default as WorkspaceStrip } from "./WorkspaceStrip.svelte";

/**
 * Layout Plugin — manages the primary workspace layout, theme, and language.
 * Always included by default in RuneProvider.
 */
export const LayoutPlugin: RunePlugin = definePlugin({
  id: "rune-lab.layout",
  stores: [
    {
      id: "layout",
      contextKey: LAYOUT_CONTEXT.layout,
      factory: (_config: unknown, driver: PersistenceDriver) =>
        createLayoutStore(driver),
    },
    {
      id: "theme",
      contextKey: LAYOUT_CONTEXT.theme,
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
          if (themeStore.get(c.defaultTheme as string)) {
            themeStore.set(c.defaultTheme as string);
          }
        }
        return themeStore;
      },
    },
    {
      id: "language",
      contextKey: LAYOUT_CONTEXT.language,
      factory: (config: unknown, driver: PersistenceDriver) => {
        // FIX: same as theme — swap in the real driver so language choices
        // are persisted to localStorage and survive page reloads.
        languageStore.setDriver(driver);

        const c = config as Record<string, unknown>;
        if (c.locales) {
          const localesToKeep = c.locales as string[];
          languageStore.available = languageStore.available.filter(
            (l: Language) => localesToKeep.includes(l.code),
          );
        }
        return languageStore;
      },
    },
  ],
  contributions: {
    settingsSections: [
      {
        id: "general",
        label: "General",
        icon: "⚙️",
        component: GeneralSettings,
      },
    ],
  },
});
