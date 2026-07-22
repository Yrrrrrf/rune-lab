import { BROWSER } from "esm-env";
import { createConfigStore } from "rune-lab";
import type { ConfigStore, SlotContext } from "rune-lab/core";

export interface Theme {
  name: string;
  icon?: string;
}

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

export function createThemeStore(
  ctx: SlotContext<unknown>,
): ConfigStore<Theme, "name"> {
  const store = createConfigStore<Theme, "name">({
    items: THEMES,
    storageKey: "theme",
    displayName: "Theme",
    idKey: "name",
    icon: "🎨",
    driver: ctx.persistence,
  });

  const saved = ctx.persistence.get("theme");
  const hasPersisted = typeof saved === "string"
    ? Boolean(saved && store.get(saved))
    : false;

  if (!hasPersisted) {
    const configTheme = typeof ctx.config === "string" ? ctx.config : undefined;
    if (configTheme && store.get(configTheme)) {
      store.set(configTheme);
    } else if (BROWSER) {
      const prefersDark = globalThis.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const systemDefault = prefersDark ? "dark" : "light";
      if (store.get(systemDefault)) {
        store.set(systemDefault);
      }
    }
  }

  return store;
}
