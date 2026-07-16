import { definePlugin } from "@rune-lab/core";
import { createPluginKit } from "@rune-lab/svelte";
import { createCommandStore } from "./commands/store.svelte.ts";
import { createShortcutStore } from "./shortcuts/store.svelte.ts";
import { createToastStore } from "./notifications/store.svelte.ts";
import { createPaletteRegistryStore } from "./registry/registry.svelte.ts";
import CommandPalette from "./palettes/commands/CommandPalette.svelte";
import ShortcutPalette from "./palettes/shortcuts/ShortcutPalette.svelte";
import SettingsModal from "./SettingsModal.svelte";
import { ShortcutSettings } from "./shortcuts/mod.ts";
import PaletteHost from "./host/PaletteHost.svelte";
import Toaster from "./notifications/Toaster.svelte";

export const palettesPluginSpec = definePlugin({
  id: "rune-lab.palettes",
  requires: ["rune-lab.layout"],
  slots: {
    commands: {
      create: () => createCommandStore(),
      expose: true,
    },
    shortcuts: {
      create: () => createShortcutStore(),
      expose: true,
    },
    toasts: {
      create: () => createToastStore(),
      expose: true,
    },
    registry: {
      create: () => {
        const store = createPaletteRegistryStore();
        store.register({
          id: "commands",
          title: "Commands",
          hotkey: "cmd+shift+k,ctrl+shift+k",
          renderer: CommandPalette,
        });
        store.register({
          id: "shortcuts",
          title: "Shortcuts",
          hotkey: "cmd+/,ctrl+/",
          renderer: ShortcutPalette,
        });
        store.register({
          id: "settings",
          title: "Settings",
          hotkey: "cmd+,,ctrl+,",
          renderer: SettingsModal,
        });
        return store;
      },
      expose: true,
    },
  },
  contributions: {
    settingsSections: [
      {
        id: "shortcuts",
        label: "Shortcuts",
        icon: "keyboard",
        component: ShortcutSettings,
      },
    ],
  },
  overlays: [PaletteHost, Toaster],
});

const kit = createPluginKit(palettesPluginSpec);

export const PalettesPlugin = kit.plugin;
