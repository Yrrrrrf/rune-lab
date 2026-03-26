// @ts-nocheck: legacy daisyui imports and complex ConfigStore typing
// client/packages/ui/src/state/theme-config.svelte.ts

import { type ConfigStore, createConfigStore } from "@rune-lab/kernel";
import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "@rune-lab/kernel";
import type { PersistenceDriver } from "@rune-lab/kernel";
import { resolveDriver } from "@rune-lab/kernel";
// import themeOrder from "daisyui/src/theming/themeOrder.js";
import { BROWSER } from "esm-env";

export interface Theme {
  name: string;
  icon: string;
}

// Icon map for known themes - unknown ones fall back to 🎨
const THEME_ICONS: Record<string, string> = {
  light: "🌞",
  dark: "🌙",
  cupcake: "🧁",
  bumblebee: "🐝",
  emerald: "💚",
  corporate: "🏢",
  synthwave: "🌆",
  retro: "📺",
  cyberpunk: "🤖",
  valentine: "💝",
  halloween: "🎃",
  garden: "🌷",
  forest: "🌲",
  aqua: "💧",
  lofi: "🎵",
  pastel: "🎨",
  fantasy: "🔮",
  wireframe: "📝",
  black: "⚫",
  luxury: "👑",
  dracula: "🧛",
  cmyk: "🖨️",
  autumn: "🍂",
  business: "💼",
  acid: "🧪",
  lemonade: "🍋",
  night: "🌃",
  coffee: "☕",
  winter: "❄️",
  dim: "🔅",
  nord: "🧊",
  sunset: "🌅",
  caramellatte: "🍮",
  abyss: "🌌",
  silk: "🎀",
};

// // Derived from daisyUI directly — stays in sync automatically
// const THEMES: Theme[] = themeOrder.map((name: string) => ({
//   name,
//   icon: THEME_ICONS[name] ?? "🎨",
// }));

// todo: Derived from daisyUI directly — stays in sync automatically
const THEMES: Theme[] = Object.keys(THEME_ICONS).map((name: string) => ({
  name,
  icon: THEME_ICONS[name] ?? "🎨",
}));

export interface ThemeStoreOptions {
  driver?: PersistenceDriver | (() => PersistenceDriver | undefined);
  /** Additional custom themes to append to the built-in DaisyUI set */
  customThemes?: Theme[];
  /** Fallback theme if no persisted value exists (after system preference check) */
  defaultTheme?: string;
}

export function createThemeStore(
  driverOrOptions?:
    | PersistenceDriver
    | (() => PersistenceDriver | undefined)
    | ThemeStoreOptions,
): ConfigStore<Theme> {
  // Normalize overloaded argument
  const opts: ThemeStoreOptions =
    driverOrOptions && typeof driverOrOptions === "object" &&
      "driver" in driverOrOptions
      ? driverOrOptions
      : {
        driver: driverOrOptions as
          | PersistenceDriver
          | (() => PersistenceDriver | undefined)
          | undefined,
      };

  const resolvedDriver = resolveDriver(opts.driver);

  const store = createConfigStore<Theme>({
    items: THEMES,
    storageKey: "theme",
    displayName: "Theme",
    idKey: "name",
    icon: "🎨",
    driver: resolvedDriver,
  });

  // Append custom themes if provided
  if (opts.customThemes?.length) {
    store.addItems(opts.customThemes);
  }

  // System preference detection — only if no persisted value was loaded
  if (!resolvedDriver?.get("theme") && BROWSER) {
    const prefersDark =
      globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
    const systemDefault = prefersDark ? "dark" : "light";
    const chosen = opts.defaultTheme ?? systemDefault;
    if (store.get(chosen as never)) {
      store.set(chosen as never);
    }
  } else if (!resolvedDriver?.get("theme") && opts.defaultTheme) {
    // SSR / non-browser: use defaultTheme if provided
    if (store.get(opts.defaultTheme as never)) {
      store.set(opts.defaultTheme as never);
    }
  }

  return store;
}

export function getThemeStore(): ConfigStore<Theme> {
  return getContext<ConfigStore<Theme>>(RUNE_LAB_CONTEXT.theme);
}
