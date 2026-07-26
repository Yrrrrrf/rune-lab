import { createPluginKit } from "rune-lab";
import type { ForgedPlugin, SlotSpec } from "rune-lab/core";
import {
  contribute,
  definePlugin,
  defineSlot,
  messages,
  settingsSections,
} from "rune-lab/core";
import type { CommandStore } from "./commands/store.svelte.ts";
import { createCommandStore } from "./commands/store.svelte.ts";
import PaletteHost from "./host/PaletteHost.svelte";
import type { ToastStore } from "./notifications/store.svelte.ts";
import { createToastStore } from "./notifications/store.svelte.ts";
import Toaster from "./notifications/Toaster.svelte";
import CommandPalette from "./palettes/commands/CommandPalette.svelte";
import type {
  PaletteRegistryStore,
  RouterAdapter,
} from "./registry/registry.svelte.ts";
import { createPaletteRegistryStore } from "./registry/registry.svelte.ts";
import SettingsModal from "./SettingsModal.svelte";
import { ShortcutSettings } from "./shortcuts/mod.ts";
import type { ShortcutStore } from "./shortcuts/store.svelte.ts";
import { createShortcutStore } from "./shortcuts/store.svelte.ts";

export interface RegistrySlotConfig {
  router?: RouterAdapter;
}

type PalettesSlots = {
  commands: SlotSpec<unknown, CommandStore>;
  shortcuts: SlotSpec<unknown, ShortcutStore>;
  toasts: SlotSpec<unknown, ToastStore>;
  registry: SlotSpec<RegistrySlotConfig, PaletteRegistryStore>;
};

const palettesPluginSpec: ForgedPlugin<"rune-lab.palettes", PalettesSlots> =
  definePlugin({
    id: "rune-lab.palettes",
    requires: ["rune-lab.layout"],
    slots: {
      commands: defineSlot({
        create: () => createCommandStore(),
        expose: true,
      }),
      shortcuts: defineSlot({
        create: () => createShortcutStore(),
        expose: true,
      }),
      toasts: defineSlot({
        create: () => createToastStore(),
        expose: true,
      }),
      registry: defineSlot({
        create: (ctx) => {
          const store = createPaletteRegistryStore(
            ctx.config as RegistrySlotConfig,
          );
          store.register({
            id: "commands",
            title: "Commands",
            hotkey: "cmd+shift+k,ctrl+shift+k",
            renderer: CommandPalette,
          });
          // C24: the standalone shortcuts palette is gone. `cmd+/` now opens the
          // settings modal at its "shortcuts" section — the same view, which
          // additionally carries the rebind affordance.
          store.register({
            id: "settings",
            title: "Settings",
            hotkey: "cmd+,,ctrl+,",
            renderer: SettingsModal,
            boxClass: "max-w-4xl",
            sectionHotkeys: [
              {
                hotkey: "cmd+/,ctrl+/",
                section: "shortcuts",
                title: "Shortcuts",
              },
            ],
          });
          return store;
        },
        expose: true,
      }),
    },
    contributions: [
      contribute(settingsSections, {
        id: "shortcuts",
        label: "Shortcuts",
        icon: "⌨️",
        component: ShortcutSettings,
      }),
      contribute(messages, {
        "palettes.shortcuts.title": "Keyboard Shortcuts",
        "palettes.shortcuts.subtitle":
          "View and customize application commands",
        "palettes.shortcuts.search_placeholder": "Search shortcuts...",
        "palettes.shortcuts.press_keys": "Press keys...",
        "palettes.shortcuts.cancel": "Cancel",
        "palettes.shortcuts.edit": "Edit",
        "palettes.settings.search_placeholder": "Search settings...",
        "palettes.settings.sections_heading": "Settings",
        "palettes.settings.navigate": "Navigate",
        "palettes.settings.select": "Select",
        "palettes.settings.no_matches_for": "No matching settings found for",
        "palettes.settings.search_results_for": "Search Results for",
        "palettes.app.repo": "Repo",
        "palettes.app.home": "Home",
        "palettes.commands.root": "Root",
        "palettes.commands.search_subcommands": "Search in subcommands...",
        "palettes.commands.what_do_you_need": "What do you need?",
        "palettes.commands.no_results_for": "No results found for",
        "palettes.commands.backspace_to_go_back": "Backspace to go back",
        "palettes.commands.search_actions_pages_settings":
          "Search actions, pages, or settings",
        "palettes.notifications.title": "Notifications",
        "palettes.notifications.unread_suffix": "unread",
        "palettes.notifications.close": "Close notification",
      }),
    ],
    overlays: [PaletteHost, Toaster],
  });

const kit = createPluginKit(palettesPluginSpec);

export const palettes: ForgedPlugin<"rune-lab.palettes", PalettesSlots> =
  kit.plugin;

export const getCommandsStore: () => CommandStore =
  kit.accessors.getCommandsStore;
export const getShortcutsStore: () => ShortcutStore =
  kit.accessors.getShortcutsStore;
export const getToastsStore: () => ToastStore = kit.accessors.getToastsStore;
export const getRegistryStore: () => PaletteRegistryStore =
  kit.accessors.getRegistryStore;
