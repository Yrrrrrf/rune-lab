<script lang="ts">
	import "./layout.css";
	import RuneProvider from "$lib/components/RuneProvider.svelte";
	import { getAppStore } from "$lib/state/app.svelte";

	let { children } = $props();
</script>

<RuneProvider>
	{@render children()}
</RuneProvider>
