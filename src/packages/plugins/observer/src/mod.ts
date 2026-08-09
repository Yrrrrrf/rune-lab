import type { ForgedPlugin, SlotSpec } from "rune-lab/core";
import {
	contribute,
	definePlugin,
	defineSlot,
	rootTakeover,
} from "rune-lab/core";
import { createPluginKit } from "rune-lab/ui";
import ObserverShell from "./ObserverShell.svelte";
import { observerSettings } from "./settings.ts";
import {
	createObserverStateStore,
	type ObserverState,
} from "./stores/state.svelte.ts";

type ObserverSlots = {
	state: SlotSpec<unknown, ObserverState>;
};

const observerPluginSpec: ForgedPlugin<"rune-lab.observer", ObserverSlots> =
	definePlugin({
		id: "rune-lab.observer",
		requires: ["rune-lab.layout"],
		slots: {
			state: defineSlot({
				create: (ctx) => createObserverStateStore(ctx),
				persist: true,
				expose: true,
			}),
		},
		settings: observerSettings,
		contributions: [
			contribute(rootTakeover, {
				id: "rune-lab.observer",
				component: ObserverShell,
			}),
		],
	});

const kit = createPluginKit(observerPluginSpec);

export const observer: ForgedPlugin<"rune-lab.observer", ObserverSlots> =
	kit.plugin;

export const getStateStore: () => ObserverState = kit.accessors.getStateStore;

export type { ObserverSection, ObserverState } from "./stores/state.svelte.ts";
export { ObserverShell };
