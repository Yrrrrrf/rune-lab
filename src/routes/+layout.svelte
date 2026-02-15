<script lang="ts">
	import "./layout.css";

	const { children } = $props();

	// use the app config to set the title and icon
	import { appConfig } from "$lib/config";

	const metaTags = [
		{ name: "description", content: appConfig.app.description },
		{ name: "author", content: appConfig.app.author },
	];
</script>

<svelte:head>
	<title>{appConfig.app.name}</title>
	<link rel="icon" href={"/img/rune.png"} />
	{#each metaTags as meta}
		<meta name={meta.name} content={meta.content} />
	{/each}
</svelte:head>

{@render children()}
