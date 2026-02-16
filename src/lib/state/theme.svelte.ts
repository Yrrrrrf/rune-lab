// client/packages/ui/src/state/theme-config.svelte.ts

import { createConfigStore } from "$lib/devtools/createConfigStore.svelte";
import themeOrder from "daisyui/functions/themeOrder.js"; // has its own .d.ts

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

export const themeStore = createConfigStore<Theme>({
  items: THEMES,
  storageKey: "theme",
  displayName: "Theme",
  idKey: "name",
  icon: "🎨",
});

// Usage:
// themeStore.set("dark")
// themeStore.get("dark")
// themeStore.getProp("icon") // gets icon of current theme
// themeStore.getProp("icon", "dark") // gets icon of specific theme
