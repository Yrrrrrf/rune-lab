// client/packages/ui/src/state/theme-config.svelte.ts

import {
  type ConfigStore,
  createConfigStore,
} from "./createConfigStore.svelte";
import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "./context";

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

// Derived from daisyUI directly — stays in sync automatically
const THEMES: Theme[] = themeOrder.map((name: string) => ({
  name,
  icon: THEME_ICONS[name] ?? "🎨",
}));

import type { PersistenceDriver } from "@internal/core";
import themeOrder from "daisyui/functions/themeOrder.js";

export function createThemeStore(
  driver?: PersistenceDriver | (() => PersistenceDriver | undefined),
) {
  return createConfigStore<Theme>({
    items: THEMES,
    storageKey: "theme",
    displayName: "Theme",
    idKey: "name",
    icon: "🎨",
    driver: typeof driver === "function" ? driver() : driver,
  });
}

export function getThemeStore() {
  return getContext<ConfigStore<Theme>>(RUNE_LAB_CONTEXT.theme);
}

// Usage:
// themeStore.set("dark")
// themeStore.get("dark")
// themeStore.getProp("icon") // gets icon of current theme
// themeStore.getProp("icon", "dark") // gets icon of specific theme
