<script lang="ts">
	import "./layout.css";
	import RuneProvider from "$lib/components/RuneProvider.svelte";
	import { getAppStore } from "$lib/state/app.svelte";

	let { children } = $props();
</script>

<RuneProvider
	app={{ name: "Rune Lab Explorer", version: "0.0.21" }}
	apiUrl="https://api.example.com"
>
	{@render children()}
</RuneProvider>
