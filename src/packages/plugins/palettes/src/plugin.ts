import type { ForgedPlugin, SlotSpec } from "@rune-lab/core";
import { definePlugin, defineSlot } from "@rune-lab/core";
import type { CommandStore } from "./commands/store.svelte.ts";
import { createCommandStore } from "./commands/store.svelte.ts";
import PaletteHost from "./host/PaletteHost.svelte";
import type { ToastStore } from "./notifications/store.svelte.ts";
import { createToastStore } from "./notifications/store.svelte.ts";
import Toaster from "./notifications/Toaster.svelte";
import CommandPalette from "./palettes/commands/CommandPalette.svelte";
import ShortcutPalette from "./palettes/shortcuts/ShortcutPalette.svelte";
import type { PaletteRegistryStore } from "./registry/registry.svelte.ts";
import { createPaletteRegistryStore } from "./registry/registry.svelte.ts";
import SettingsModal from "./SettingsModal.svelte";
import { ShortcutSettings } from "./shortcuts/mod.ts";
import type { ShortcutStore } from "./shortcuts/store.svelte.ts";
import { createShortcutStore } from "./shortcuts/store.svelte.ts";

type PalettesSlots = {
  commands: SlotSpec<unknown, CommandStore>;
  shortcuts: SlotSpec<unknown, ShortcutStore>;
  toasts: SlotSpec<unknown, ToastStore>;
  registry: SlotSpec<unknown, PaletteRegistryStore>;
};

export const PalettesPlugin: ForgedPlugin<"rune-lab.palettes", PalettesSlots> =
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
      }),
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
