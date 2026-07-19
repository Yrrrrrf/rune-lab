<script lang="ts">
import type {
	LocaleAdapter,
	PersistenceDriver,
	PluginInput,
} from "@rune-lab/core";
import { createKernel, namespaced } from "@rune-lab/core";
import { type Component, type Snippet, setContext, untrack } from "svelte";
import {
	cookieDriver,
	createInMemoryDriver,
	localStorageDriver,
	sessionStorageDriver,
} from "./persistence/drivers.ts";
import { RUNE_LAB_CONTEXT } from "./provider/context.ts";
import { type AppData, createAppStore } from "./reactivity/app.svelte.ts";

/**
 * Namespaced configuration for Rune Lab plugins.
 * Keyed by plugin.id.
 */
export interface RuneLabConfig {
	persistence?: PersistenceDriver;
	/** Optional head management properties */
	favicon?: string;
	manageHead?: boolean;
	icons?: "material" | "none";
	/** App metadata — passed to AppStore.init() */
	app?: Partial<AppData>;
	/** Namespaced config for plugins */
	[pluginId: string]: unknown;
}

let {
	children,
	config = {},
	plugins = [],
	localeAdapter,
}: {
	children: Snippet;
	config?: RuneLabConfig;
	plugins?: PluginInput[];
	localeAdapter?: LocaleAdapter;
} = $props();

const initialPersistence = untrack(() => {
	let savedDriverType = "local";
	if (typeof window !== "undefined") {
		savedDriverType =
			window.localStorage.getItem("rl:persistence:driver") || "local";
	}
	let baseDriver = localStorageDriver;
	if (savedDriverType === "memory") baseDriver = createInMemoryDriver();
	else if (savedDriverType === "session") baseDriver = sessionStorageDriver;
	else if (savedDriverType === "cookie") baseDriver = cookieDriver;
	return namespaced(config.persistence ?? baseDriver, "rl:");
});

// 0. Create and provide the built-in AppStore
const appStore = createAppStore();
untrack(() => {
	if (config.app) {
		appStore.init(config.app);
	}
});
setContext(RUNE_LAB_CONTEXT.app, appStore);

// 1. Construct the kernel
const kernel = createKernel(
	untrack(() => plugins),
	{
		config: untrack(() => config as Record<string, unknown>),
		persistence: initialPersistence,
		localeAdapter: untrack(() => localeAdapter),
	},
);

// Provide the kernel itself
setContext(RUNE_LAB_CONTEXT.kernel, kernel);

// 2. Provide all stores as context
for (const [id, store] of kernel.stores) {
	const entry = kernel.getStoreEntry(id);
	if (entry?.contextKey && store) {
		setContext(entry.contextKey, store);
	}
}

// Also provide the persistence driver itself
setContext(RUNE_LAB_CONTEXT.persistence, initialPersistence);
setContext(
	RUNE_LAB_CONTEXT.settingsSections,
	kernel.getContributions("settingsSections"),
);

// 3. Collect all overlays
const allOverlays = $derived(kernel.overlays as Component[]);

// Meta tags derived from app store state
const metaTags = $derived([
	{ name: "description", content: appStore.description },
	{ name: "author", content: appStore.author },
]);
</script>

<svelte:head>
  {#if config.manageHead !== false && appStore}
    <title>{appStore.name}</title>
    {#if config.favicon}
      <link rel="icon" href={config.favicon} />
    {/if}
    {#each metaTags as meta}
      <meta name={meta.name} content={meta.content} />
    {/each}
    {#if config.icons === "material"}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
      />
    {/if}
  {/if}
</svelte:head>

<!-- Plugin Overlays -->
{#each allOverlays as Overlay}
  <Overlay />
{/each}

<!-- Render Children -->
{@render children()}
