import { createConfigStore } from "@rune-lab/svelte";
import { BROWSER } from "esm-env";
import { createMessageResolver } from "../../../i18n/src/lang/message-resolver.ts";
import { m } from "../../../i18n/src/mod.ts";

export interface Theme {
  name: string;
  icon?: string;
}

export const getThemeName = createMessageResolver(m, {
  keyExtractor: (t: Theme) => t.name,
});

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

export function createThemeStore(ctx: any) {
  const store = createConfigStore({
    items: THEMES,
    storageKey: "theme",
    displayName: "Theme",
    idKey: "name",
    icon: "🎨",
    driver: ctx.persistence,
  });

  if (!store.current && BROWSER) {
    const prefersDark = globalThis.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const systemDefault = prefersDark ? "dark" : "light";
    if (store.get(systemDefault)) {
      store.set(systemDefault);
    }
  }

  return store;
}
