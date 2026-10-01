import { definePlugin, defineSlot } from "rune-lab/core";
import type { ApiConfig } from "./types.ts";
import { createApiStore } from "./store.svelte.ts";
import { API_PLUGIN_ID } from "./context.ts";
import { apiSettings } from "./settings.ts";
import APIRuntime from "./components/APIRuntime.svelte";

export const api = definePlugin({
	id: API_PLUGIN_ID,
	slots: {
		api: defineSlot<ApiConfig | undefined, ReturnType<typeof createApiStore>>({
			// Persist only the explicit 'preferences' payload written by the controller.
			persist: ["preferences"],
			create: ({ config, persistence }) => createApiStore(config, persistence),
		}),
	},
	settings: apiSettings,
	overlays: [APIRuntime],
});
