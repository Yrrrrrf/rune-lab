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

// "system" is a pseudo-item, not a daisyUI theme: it means "no explicit
// choice yet", and applyTheme below deliberately never writes it to the DOM.
// It goes first so the store's default seed (items[0]) lands on it.
const SYSTEM: Theme = { name: "system", icon: "🖥️" };

export const THEMES = [
  SYSTEM,
  ...Object.keys(THEME_ICONS).map((name: string) => ({
    name,
    icon: THEME_ICONS[name] ?? "🎨",
  })),
] as Theme[];

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
    // C28: seeding from config still persists via store.set() today — a
    // deliberate "not now" call. Fixing it needs a way to set `current`
    // without writing to storage, which core doesn't expose yet.
    const configTheme = typeof ctx.config === "string" ? ctx.config : undefined;
    if (configTheme && store.get(configTheme)) {
      store.set(configTheme);
    }
    // else: leave current at "system". No matchMedia probe here — after the
    // daisyUI CSS migration (C16), `:root:not([data-theme])` resolves the OS
    // preference in CSS, so JS never needs to guess it.
  }

  const applyTheme = (name: string): void => {
    if (!BROWSER) return;
    if (name === SYSTEM.name) {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = name;
    }
  };

  store.onChange((name) => applyTheme(String(name)));
  applyTheme(String(store.current)); // required: sync driver reads don't notify (C27)

  return store;
}
