import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "./context.ts";
import type { ConfigStore } from "../persistence/createConfigStore.svelte.ts";
import type {
  Command,
  Currency,
  Language,
  Theme,
  Toast,
  ToastType,
} from "./types.ts";
import type { LayoutStore } from "../../../runes/layout/src/store.svelte.ts";
import type { ShortcutStore } from "../../../runes/palettes/src/shortcuts/store.svelte.ts";

/**
 * Common store interfaces
 */

export interface ICommandStore {
  commands: Command[];
  register(command: Command): void;
  unregister(id: string): void;
  search(query: string, parentId?: string): Command[];
}

export interface IToastStore {
  toasts: Toast[];
  send(message: string, type?: ToastType, duration?: number): void;
  success(msg: string): void;
  error(msg: string): void;
  warn(msg: string): void;
  info(msg: string): void;
  dismiss(id: string): void;
  pause(id: string): void;
  resume(id: string): void;
}

export interface ICurrencyStore extends ConfigStore<Currency, "code"> {
  canConvert: boolean;
  convertAmount(amount: number, fromCode: string, toCode?: string): number;
  addCurrency(meta: Currency, dineroDef?: unknown): void;
}

/**
 * Store context accessors
 */

export function getLayoutStore(): LayoutStore {
  const store = getContext<LayoutStore>(RUNE_LAB_CONTEXT.layout);
  if (!store) {
    throw new Error(
      "[rune-lab] getLayoutStore() found no LayoutStore. Did you register LayoutPlugin in <RuneProvider plugins={[…]}>?",
    );
  }
  return store;
}

export function getLanguageStore(): ConfigStore<Language, "code"> {
  const store = getContext<ConfigStore<Language, "code">>(
    RUNE_LAB_CONTEXT.language,
  );
  if (!store) {
    throw new Error(
      "[rune-lab] getLanguageStore() found no LanguageStore. Did you register LayoutPlugin in <RuneProvider plugins={[…]}>?",
    );
  }
  return store;
}

export function getThemeStore(): ConfigStore<Theme, "name"> {
  const store = getContext<ConfigStore<Theme, "name">>(RUNE_LAB_CONTEXT.theme);
  if (!store) {
    throw new Error(
      "[rune-lab] getThemeStore() found no ThemeStore. Did you register LayoutPlugin in <RuneProvider plugins={[…]}>?",
    );
  }
  return store;
}

export function getShortcutStore(): ShortcutStore {
  const store = getContext<ShortcutStore>(RUNE_LAB_CONTEXT.shortcut);
  if (!store) {
    throw new Error(
      "[rune-lab] getShortcutStore() found no ShortcutStore. Did you register PalettesPlugin in <RuneProvider plugins={[…]}>?",
    );
  }
  return store;
}

export function getCommandStore(): ICommandStore {
  const store = getContext<ICommandStore>(RUNE_LAB_CONTEXT.commands);
  if (!store) {
    throw new Error(
      "[rune-lab] getCommandStore() found no CommandStore. Did you register PalettesPlugin in <RuneProvider plugins={[…]}>?",
    );
  }
  return store;
}

export function getToastStore(): IToastStore {
  const store = getContext<IToastStore>(RUNE_LAB_CONTEXT.toast);
  if (!store) {
    throw new Error(
      "[rune-lab] getToastStore() found no ToastStore. Did you register PalettesPlugin in <RuneProvider plugins={[…]}>?",
    );
  }
  return store;
}

export function getCurrencyStore(): ICurrencyStore {
  const store = getContext<ICurrencyStore>(RUNE_LAB_CONTEXT.currency);
  if (!store) {
    throw new Error(
      "[rune-lab] getCurrencyStore() found no CurrencyStore. Did you register MoneyPlugin in <RuneProvider plugins={[…]}>?",
    );
  }
  return store;
}

/**
 * Standard layout shortcuts
 */
export const LAYOUT_SHORTCUTS = {
  TOGGLE_NAV: {
    id: "layout:toggle-nav",
    keys: "ctrl+b",
    label: "Toggle Sidebar",
    category: "Layout",
  },
  TOGGLE_DETAIL: {
    id: "layout:toggle-detail",
    keys: "ctrl+alt+b",
    label: "Toggle Detail Panel",
    category: "Layout",
  },
  OPEN_SHORTCUTS: {
    id: "layout:open-shortcuts",
    keys: "ctrl+/",
    label: "Show Shortcuts",
    category: "Layout",
  },
} as const;
