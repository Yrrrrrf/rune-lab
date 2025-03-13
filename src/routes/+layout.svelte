<script lang="ts">
    import UrlDisplay from '$lib/components/layout/URLDisplay.svelte';
    import { UIShowcase } from '$lib/mod.js';
	import '../app.css';
	let { children } = $props();

    import { onMount } from 'svelte';

    onMount(() => {
    });

</script>

<svelte:head>
    <!-- <title>{appData.name}</title>
    {#each metaTags as meta}
        <meta name={meta.name} content={meta.content} />
    {/each} -->
</svelte:head>

<!-- <Altharun /> -->

<UIShowcase />

<div class="min-h-screen flex flex-col">
    <main class="flex-grow">
        {@render children()}
    </main>

    <!-- <Footer /> -->
</div>

<UrlDisplay />
