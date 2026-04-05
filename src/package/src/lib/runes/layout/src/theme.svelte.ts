// @ts-nocheck: legacy daisyui imports and complex ConfigStore typing
// client/packages/ui/src/state/theme-config.svelte.ts

import { createConfigStore, getThemeStore } from "../../../kernel/src/mod.ts";
import type { Theme } from "../../../kernel/src/mod.ts";
import { BROWSER } from "esm-env";
import { createMessageResolver } from "../../../i18n/message-resolver.ts";
import { m } from "../../../i18n/messages.ts";

export type { Theme };

/**
 * Resolver to get the display name of a theme in the current locale
 */
export const getThemeName = createMessageResolver<Theme>(m, {
  keyExtractor: (t) => t.name,
});

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

const THEMES: Theme[] = Object.keys(THEME_ICONS).map((name: string) => ({
  name,
  icon: THEME_ICONS[name] ?? "🎨",
}));

export const themeStore: ConfigStore<Theme> = createConfigStore<Theme>({
  items: THEMES,
  storageKey: "theme",
  displayName: "Theme",
  idKey: "name",
  icon: "🎨",
});

// System preference detection — only if no persisted value was loaded
if (!themeStore.current && BROWSER) {
  const prefersDark =
    globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
  const systemDefault = prefersDark ? "dark" : "light";
  if (themeStore.get(systemDefault as never)) {
    themeStore.set(systemDefault as never);
  }
}

export type ThemeStore = ReturnType<typeof createConfigStore<Theme>>;
export { getThemeStore };
