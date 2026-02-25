<script lang="ts">
	import "./layout.css";
	import RuneProvider from "$lib/components/RuneProvider.svelte";
	import * as m from "$lib/paraglide/messages.js";

	let { children } = $props();
</script>

<RuneProvider
	config={{
		app: { name: "Rune Lab Explorer", version: "0.0.21" },
		apiUrl: "https://api.example.com",
		apiHealthCheck: async () => true,
		dictionary: m,
		favicon: "/img/rune.png",
	}}
>
	{@render children()}
</RuneProvider>
