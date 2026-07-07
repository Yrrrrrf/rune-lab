import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "./context.ts";
import type { ConfigStore } from "../persistence/createConfigStore.svelte.ts";
import type {
  Command,
  Currency,
  Language,
  ShortcutEntry,
  Theme,
  Toast,
  ToastType,
} from "./types.ts";

import type { PersistenceDriver } from "@rune-lab/core";

export interface LayoutStore {
  init(options?: { namespace?: string; driver?: PersistenceDriver }): void;
  toggleNav(): void;
  toggleDetail(): void;
  detailOpen: boolean;
  navOpen: boolean;
  activeNavItemId: string | null;
  collapsedSections: Set<string>;
  navigate(path: string): void;
  expandSection(section: string): void;
  collapseSection(section: string): void;
  setDriver(driver: PersistenceDriver): void;
}

export interface ShortcutStore {
  showPalette: boolean;
  active: ShortcutEntry[];
  entries: ShortcutEntry[];
  sortedScopes: string[];
  byScopeAndCategory: Record<string, Record<string, ShortcutEntry[]>>;
  register(entry: ShortcutEntry): void;
  unregister(id: string): void;
}

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

function createAccessor<T>(
  contextKey: symbol,
  accessorName: string,
  storeName: string,
  pluginName: string,
): () => T {
  return () => {
    const store = getContext<T>(contextKey);
    if (!store) {
      throw new Error(
        `[rune-lab] ${accessorName} found no ${storeName}. Did you register ${pluginName} in <RuneProvider plugins={[…]}>?`,
      );
    }
    return store;
  };
}

export const getLayoutStore: () => LayoutStore = createAccessor<LayoutStore>(
  RUNE_LAB_CONTEXT.layout,
  "getLayoutStore()",
  "LayoutStore",
  "LayoutPlugin",
);

export const getLanguageStore: () => ConfigStore<Language, "code"> =
  createAccessor<ConfigStore<Language, "code">>(
    RUNE_LAB_CONTEXT.language,
    "getLanguageStore()",
    "LanguageStore",
    "LayoutPlugin",
  );

export const getThemeStore: () => ConfigStore<Theme, "name"> = createAccessor<
  ConfigStore<Theme, "name">
>(
  RUNE_LAB_CONTEXT.theme,
  "getThemeStore()",
  "ThemeStore",
  "LayoutPlugin",
);

export const getShortcutStore: () => ShortcutStore = createAccessor<
  ShortcutStore
>(
  RUNE_LAB_CONTEXT.shortcut,
  "getShortcutStore()",
  "ShortcutStore",
  "PalettesPlugin",
);

export const getCommandStore: () => ICommandStore = createAccessor<
  ICommandStore
>(
  RUNE_LAB_CONTEXT.commands,
  "getCommandStore()",
  "CommandStore",
  "PalettesPlugin",
);

export const getToastStore: () => IToastStore = createAccessor<IToastStore>(
  RUNE_LAB_CONTEXT.toast,
  "getToastStore()",
  "ToastStore",
  "PalettesPlugin",
);

export const getCurrencyStore: () => ICurrencyStore = createAccessor<
  ICurrencyStore
>(
  RUNE_LAB_CONTEXT.currency,
  "getCurrencyStore()",
  "CurrencyStore",
  "MoneyPlugin",
);

export interface SettingsSection {
  id: string;
  label: string;
  icon?: string;
  component: unknown;
}

export const getSettingsSections: () => SettingsSection[] = createAccessor<
  SettingsSection[]
>(
  RUNE_LAB_CONTEXT.settingsSections,
  "getSettingsSections()",
  "SettingsSections",
  "RuneProvider",
);

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
