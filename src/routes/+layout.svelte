<script lang="ts">
    import '../app.css';

    import { onMount } from 'svelte';

    // import { appData } from '$lib/stores/app.svelte.js';
    // import { themeStore } from "$lib/mod.js";
    
    // import UIShowcase from '$lib/components/ui/showcase/main.svelte';
    // import UrlDisplay from '$lib/components/layout/URLDisplay.svelte';

    let { children } = $props();

    onMount(() => {
        console.log('App mounted');

        // appData.init({
        //     name: 'Rune Lab',
        //     version: '0.1.0',
        //     description: 'A modern component library built with Svelte 5 Runes',
        //     author: 'Yrrrrrf'
        // });
        // themeStore.init();
    });

    const metaTags = [
        { name: 'description', content: 'SvelteKit app' },
        { name: 'author', content: 'Yrrrrrf' },
    ];

</script>

<svelte:head>
    <!-- <title>{appData.name}</title> -->
    {#each metaTags as meta}
        <meta name={meta.name} content={meta.content} />
    {/each}
</svelte:head>

<!-- <StyleCollector /> -->
 
{@render children()}
