import type { ForgedPlugin, SlotSpec } from "rune-lab/core";
import {
	contribute,
	definePlugin,
	defineSlot,
	settingsSections,
} from "rune-lab/core";
import { createPluginKit } from "rune-lab/ui";
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
	command: SlotSpec<unknown, CommandStore>;
	shortcut: SlotSpec<unknown, ShortcutStore>;
	toast: SlotSpec<unknown, ToastStore>;
	registry: SlotSpec<RegistrySlotConfig, PaletteRegistryStore>;
};

const palettesPluginSpec: ForgedPlugin<"rune-lab.palettes", PalettesSlots> =
	definePlugin({
		id: "rune-lab.palettes",
		requires: ["rune-lab.layout"],
		slots: {
			command: defineSlot({
				create: () => createCommandStore(),
				expose: true,
			}),
			shortcut: defineSlot({
				create: () => createShortcutStore(),
				expose: true,
			}),
			toast: defineSlot({
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
		],
		overlays: [PaletteHost, Toaster],
	});

const kit = createPluginKit(palettesPluginSpec);

export const palettes: ForgedPlugin<"rune-lab.palettes", PalettesSlots> =
	kit.plugin;

export const getCommandStore: () => CommandStore =
	kit.accessors.getCommandStore;
export const getShortcutStore: () => ShortcutStore =
	kit.accessors.getShortcutStore;
export const getToastStore: () => ToastStore = kit.accessors.getToastStore;
export const getRegistryStore: () => PaletteRegistryStore =
	kit.accessors.getRegistryStore;
