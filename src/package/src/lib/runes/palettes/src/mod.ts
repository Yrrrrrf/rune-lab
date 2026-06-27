import { defineRune, RUNE_LAB_CONTEXT } from "../../../kernel/src/mod.ts";
import type { ConfigStore, RunePlugin } from "../../../kernel/src/mod.ts";
import { createCommandStore } from "./commands/store.svelte.ts";
import { createShortcutStore } from "./shortcuts/store.svelte.ts";
import { createToastStore } from "./notifications/store.svelte.ts";
import type { ToastStore } from "./notifications/store.svelte.ts";
import CommandPalette from "./commands/CommandPalette.svelte";
import ShortcutPalette from "./shortcuts/ShortcutPalette.svelte";
import Toaster from "./notifications/Toaster.svelte";

export * from "./commands/mod.ts";
export * from "./shortcuts/mod.ts";
export * from "./notifications/mod.ts";

/**
 * Palettes Plugin — provides the command palette, shortcut manager, and toast system.
 * Always included by default in RuneProvider.
 */
export const PalettesPlugin: RunePlugin = defineRune({
  id: "rune-lab.palettes",
  stores: [
    {
      id: "commands",
      contextKey: RUNE_LAB_CONTEXT.commands,
      factory: (_config, _driver, stores) =>
        createCommandStore({
          appStore: stores.get("app"),
          apiStore: stores.get("api"),
          toastStore: stores.get("toast") as ToastStore,
          themeStore: stores.get("theme") as ConfigStore<
            Record<string, unknown>,
            string
          >,
          languageStore: stores.get("language") as ConfigStore<
            Record<string, unknown>,
            string
          >,
          currencyStore: stores.get("currency") as ConfigStore<
            Record<string, unknown>,
            string
          >,
        }),
      dependsOn: ["app", "api", "toast", "theme", "language", "currency"],
      noPersistence: true,
    },
    {
      id: "shortcut",
      contextKey: RUNE_LAB_CONTEXT.shortcut,
      factory: () => createShortcutStore(),
      noPersistence: true,
    },
    {
      id: "toast",
      contextKey: RUNE_LAB_CONTEXT.toast,
      factory: () => createToastStore(),
      noPersistence: true,
    },
  ],
  overlays: [CommandPalette, ShortcutPalette, Toaster],
});
