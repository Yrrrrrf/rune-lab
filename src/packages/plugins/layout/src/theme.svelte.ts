// @ts-nocheck: legacy daisyui imports and complex ConfigStore typing
// client/packages/ui/src/state/theme-config.svelte.ts

import { createConfigStore } from "@rune-lab/svelte";
import { BROWSER } from "esm-env";
import { createMessageResolver, m } from "rune-lab/i18n/lang";
import type { Theme } from "./types.ts";

/**
 * Resolver to get the display name of a theme in the current locale
 */
export const getThemeName: (t: Theme) => string = createMessageResolver<Theme>(
  m,
  {
    keyExtractor: (t: Theme) => t.name,
  },
);

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

const THEMES = Object.keys(THEME_ICONS).map((name: string) => ({
  name,
  icon: THEME_ICONS[name] ?? "🎨",
})) as Theme[];

export const themeStore: ConfigStore<Theme, "name"> = createConfigStore<
  Theme,
  "name"
>({
  items: THEMES,
  storageKey: "theme",
  displayName: "Theme",
  idKey: "name",
  icon: "🎨",
});

// System preference detection — only if no persisted value was loaded
if (!themeStore.current && BROWSER) {
  const prefersDark = globalThis.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
  const systemDefault = prefersDark ? "dark" : "light";
  if (themeStore.get(systemDefault)) {
    themeStore.set(systemDefault);
  }
}

export type ThemeStore = ReturnType<typeof createConfigStore<Theme, "name">>;
