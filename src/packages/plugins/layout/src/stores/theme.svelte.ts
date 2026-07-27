import { BROWSER } from "esm-env";
import { createConfigStore } from "rune-lab";
import type { ConfigStore, SlotContext } from "rune-lab/core";

export interface Theme {
  name: string;
}

// C22: no per-item icon anymore — ThemeSwatch renders each theme's actual
// daisyUI colors via a nested `data-theme`, so the name list is all that's
// needed here. 35 hand-assigned emoji, derived from nothing, are gone.
const THEME_NAMES = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset",
  "caramellatte",
  "abyss",
  "silk",
];

// "system" is a pseudo-item, not a daisyUI theme: it means "no explicit
// choice yet", and applyTheme below deliberately never writes it to the DOM.
// It goes first so the store's default seed (items[0]) lands on it.
const SYSTEM: Theme = { name: "system" };

export const THEMES = [
  SYSTEM,
  ...THEME_NAMES.map((name: string) => ({ name })),
] as Theme[];

// C21: the plugin config narrows which daisyUI themes exist; default is all
// 35 (rune-lab cannot detect the consumer's `@plugin "daisyui"` enabled set).
// `available` and the settings-modal options (C20) both derive from this same
// narrowed store, so the two surfaces can no longer disagree.
export interface ThemeConfig {
  readonly available?: readonly string[];
  readonly default?: string;
}

export function createThemeStore(
  ctx: SlotContext<ThemeConfig>,
): ConfigStore<Theme, "name"> {
  const configured = ctx.config;

  // ConfigStoreImpl sets `available` once at construction and never narrows
  // it afterward, so narrowing has to happen on the item list going in, not
  // via a prop on the consuming component.
  const items = configured?.available
    ? THEMES.filter(
      (t) => t.name === SYSTEM.name || configured.available!.includes(t.name),
    )
    : THEMES;

  const store = createConfigStore<Theme, "name">({
    items,
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
    //
    // `default` is an explicit author choice, unlike the system-preference
    // case below, so it's the one branch that's supposed to write on init.
    const configTheme = configured?.default;
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
