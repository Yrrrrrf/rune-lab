import { definePlugin, defineSlot } from "rune-lab/core";
import { CORPO_PLUGIN_ID } from "./context.ts";
import { createCorpoStore, type CorpoStore } from "./store.svelte.ts";
import { corpoSettings } from "./settings.ts";
import type { CorpoConfig } from "./types.ts";
export const corpo = definePlugin({
	id: CORPO_PLUGIN_ID,
	requires: [
		"rune-lab.layout",
		"rune-lab.palettes",
		"rune-lab.i18n",
		"rune-lab.api",
	],
	slots: {
		corpo: defineSlot<CorpoConfig, CorpoStore>({
			create: ({ config }) => createCorpoStore(config),
		}),
	},
	settings: corpoSettings,
});
