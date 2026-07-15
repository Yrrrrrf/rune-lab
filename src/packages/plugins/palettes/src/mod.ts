import type { ConfigStore, RunePlugin } from "@rune-lab/svelte";
import { createAccessor, definePlugin, defineSettings } from "@rune-lab/svelte";
import CommandPalette from "./commands/CommandPalette.svelte";
import type { CommandStore } from "./commands/store.svelte.ts";
import { createCommandStore } from "./commands/store.svelte.ts";
import type { ToastStore } from "./notifications/store.svelte.ts";
import { createToastStore } from "./notifications/store.svelte.ts";
import Toaster from "./notifications/Toaster.svelte";
import SettingsModal from "./SettingsModal.svelte";
import ShortcutPalette from "./shortcuts/ShortcutPalette.svelte";
import type { ShortcutStore } from "./shortcuts/store.svelte.ts";
import { createShortcutStore } from "./shortcuts/store.svelte.ts";

export const PALETTES_CONTEXT: {
  shortcut: symbol;
  toast: symbol;
  commands: symbol;
} = {
  shortcut: Symbol("rl:shortcut"),
  toast: Symbol("rl:toast"),
  commands: Symbol("rl:commands"),
};

export const getShortcutStore: () => ShortcutStore = createAccessor<
  ShortcutStore
>(
  PALETTES_CONTEXT.shortcut,
  "getShortcutStore()",
  "ShortcutStore",
  "PalettesPlugin",
);

export const getCommandStore: () => CommandStore = createAccessor<CommandStore>(
  PALETTES_CONTEXT.commands,
  "getCommandStore()",
  "CommandStore",
  "PalettesPlugin",
);

export const getToastStore: () => ToastStore = createAccessor<ToastStore>(
  PALETTES_CONTEXT.toast,
  "getToastStore()",
  "ToastStore",
  "PalettesPlugin",
);

import { ShortcutSettings } from "./shortcuts/mod.ts";

export * from "./commands/mod.ts";
export * from "./notifications/mod.ts";
export * from "./shortcuts/mod.ts";
export * from "./theme/plugin.ts";

/**
 * Palettes Plugin — provides the command palette, shortcut manager, and toast system.
 */
export const PalettesPlugin: RunePlugin = definePlugin({
  id: "rune-lab.palettes",
  stores: [
    {
      id: "commands",
      contextKey: PALETTES_CONTEXT.commands,
      factory: (_config: any, _driver: any, stores: any) =>
        createCommandStore({
          appStore: stores.get("app"),
          apiStore: stores.get("api"),
          toastStore: stores.get("toast") as ToastStore,
          themeStore: stores.get("theme") as any,
          languageStore: stores.get("language") as any,
          currencyStore: stores.get("currency") as any,
        }),
      dependsOn: ["app", "api", "toast", "theme", "language", "currency"],
      noPersistence: true,
    },
    {
      id: "shortcut",
      contextKey: PALETTES_CONTEXT.shortcut,
      factory: () => createShortcutStore(),
      noPersistence: true,
    },
    {
      id: "toast",
      contextKey: PALETTES_CONTEXT.toast,
      factory: () => createToastStore(),
      noPersistence: true,
    },
  ],
  contributions: {
    settingsSections: [
      {
        id: "shortcuts",
        label: "Shortcuts",
        icon: "⌨️",
        component: ShortcutSettings,
      },
    ],
  },
  overlays: [CommandPalette, ShortcutPalette, Toaster, SettingsModal],
});
