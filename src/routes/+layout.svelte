<script lang="ts">
    import UrlDisplay from '$lib/components/layout/URLDisplay.svelte';
    import { appData } from '$lib/stores/app.svelte.js';
    import { themeStore } from "$lib/mod.js";
    import { UIShowcase } from '$lib/index.js';

    import '../app.css';

    let { children } = $props();


    import { onMount } from 'svelte';

    onMount(() => {
        console.log('layout mounted');

        appData.init({
            name: 'Rune Lab',
            version: '0.1.0',
            description: 'A modern component library built with Svelte 5 Runes',
            author: 'Yrrrrrf'
        });
        themeStore.init();
    });

    const metaTags = [
        { name: 'description', content: 'SvelteKit app' },
        { name: 'author', content: 'Yrrrrrf' },
    ];

</script>

<svelte:head>
    <title>{appData.name}</title>
    {#each metaTags as meta}
        <meta name={meta.name} content={meta.content} />
    {/each}
</svelte:head>

<!-- <Altharun /> -->

<!-- <UIShowcase /> -->

<div class="min-h-screen flex flex-col">
    <main class="flex-grow">
        {@render children()}
    </main>

    <!-- <Footer /> -->
</div>

<UrlDisplay />
