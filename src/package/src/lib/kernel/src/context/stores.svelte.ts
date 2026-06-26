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
}

export interface ICurrencyStore extends ConfigStore<Currency> {
  canConvert: boolean;
  convertAmount(amount: number, fromCode: string, toCode?: string): number;
  addCurrency(meta: Currency, dineroDef?: unknown): void;
}

/**
 * Store context accessors
 */

export function getLayoutStore(): LayoutStore {
  return getContext<LayoutStore>(RUNE_LAB_CONTEXT.layout);
}

export function getLanguageStore(): ConfigStore<Language> {
  return getContext<ConfigStore<Language>>(RUNE_LAB_CONTEXT.language);
}

export function getThemeStore(): ConfigStore<Theme> {
  return getContext<ConfigStore<Theme>>(RUNE_LAB_CONTEXT.theme);
}

export function getShortcutStore(): ShortcutStore {
  return getContext<ShortcutStore>(RUNE_LAB_CONTEXT.shortcut);
}

export function getCommandStore(): ICommandStore {
  return getContext<ICommandStore>(RUNE_LAB_CONTEXT.commands);
}

export function getToastStore(): IToastStore {
  return getContext<IToastStore>(RUNE_LAB_CONTEXT.toast);
}

export function getCurrencyStore(): ICurrencyStore {
  return getContext<ICurrencyStore>(RUNE_LAB_CONTEXT.currency);
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
