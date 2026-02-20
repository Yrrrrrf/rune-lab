<script lang="ts">
	import "./layout.css";
	import { setContext } from "svelte";
	import {
		createAppStore,
		createCommandStore,
		createLayoutStore,
	} from "$lib/config";
	import { CommandPalette, ShortcutPalette } from "$lib/index.ts";

	let { children } = $props();

	// Initialize Core Stores (Scoped per request/context)
	const appStore = createAppStore();
	setContext("rl:app", appStore);

	const layoutStore = createLayoutStore();
	setContext("rl:layout", layoutStore);

	const commandStore = createCommandStore(appStore); // Inject appStore dependency
	setContext("rl:commands", commandStore);

	// Meta tags derived from app store state
	const metaTags = $derived([
		{ name: "description", content: appStore.description },
		{ name: "author", content: appStore.author },
	]);
</script>

<CommandPalette />
<ShortcutPalette />

<svelte:head>
	<title>{appStore.name}</title>
	<link rel="icon" href={"/img/rune.png"} />
	{#each metaTags as meta}
		<meta name={meta.name} content={meta.content} />
	{/each}
</svelte:head>

{@render children()}
