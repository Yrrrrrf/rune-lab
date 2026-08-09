<script lang="ts">
import type {
	LocaleAdapter,
	PersistenceDriver,
	PluginInput,
} from "rune-lab/core";
import {
	createInMemoryDriver,
	createKernel,
	rootTakeover,
} from "rune-lab/core";
import { type Component, type Snippet, setContext, untrack } from "svelte";
import {
	cookieDriver,
	localStorageDriver,
	sessionStorageDriver,
} from "./persistence/drivers.ts";
import { RUNE_LAB_CONTEXT } from "./provider/context.ts";
import { type AppData, createAppStore } from "./reactivity/app.svelte.ts";

/**
 * Configuration options for RuneProvider (persistence driver, head management, app metadata).
 */
export interface RuneLabConfig {
	persistence?: PersistenceDriver;
	/** App metadata — passed to AppStore.init() */
	app?: Partial<AppData>;
	pluginConfig?: Record<string, Record<string, unknown>>;
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

const DRIVERS: Record<string, PersistenceDriver> = {
	local: localStorageDriver,
	session: sessionStorageDriver,
	cookie: cookieDriver,
	memory: createInMemoryDriver(),
};

const initialPersistence = untrack(() => {
	const saved = localStorageDriver.get("rl:persistence:driver");
	const baseDriver = DRIVERS[String(saved ?? "local")] ?? DRIVERS.local;
	return config.persistence ?? baseDriver;
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
		persistence: initialPersistence,
		localeAdapter: untrack(() => localeAdapter),
		pluginConfig: untrack(() => config.pluginConfig),
	},
);

// Teardown kernel on unmount
$effect(() => () => {
	kernel.dispose();
});

// Expose the kernel on window so a same-origin embedder (e.g. the observer
// plugin's iframe) can poll it without a postMessage protocol.
if (typeof window !== "undefined") {
	(window as unknown as { __rune_kernel__?: typeof kernel }).__rune_kernel__ =
		kernel;
}

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

// 3. Collect all overlays
const allOverlays = kernel.overlays as Component[];

// 4. Check whether a plugin has claimed the root — if so, it renders instead
// of {@render children()}. Overlays above still render unconditionally, so
// e.g. the settings modal stays reachable while a takeover is active.
const takeoverEntries = kernel.getContributions(rootTakeover);
if (takeoverEntries.length > 1) {
	console.warn(
		`[rune-lab] Multiple plugins contributed rootTakeover (${
			takeoverEntries.map((e) => e.id).join(",")
		}); using "${takeoverEntries[0].id}".`,
	);
}
const Takeover = takeoverEntries[0]?.component as
	| Component<{ children: Snippet }>
	| undefined;

// Meta tags derived from app store state
const metaTags = $derived([
	{ name: "description", content: appStore.data.description },
	{ name: "author", content: appStore.data.author },
]);
</script>

<svelte:head>
    {#if appStore.data.name}
      <title>{appStore.data.name}</title>
    {/if}
    {#if appStore.data.icon}
      <link rel="icon" href={appStore.data.icon} />
    {/if}
    {#each metaTags as meta}
      {#if meta.content}
        <meta name={meta.name} content={meta.content} />
      {/if}
    {/each}
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
    />
</svelte:head>

<!-- Plugin Overlays -->
{#each allOverlays as Overlay}
  <Overlay />
{/each}

<!-- Render Children, or a plugin's root takeover -->
{#if Takeover}
  <Takeover {children} />
{:else}
  {@render children()}
{/if}
