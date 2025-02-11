<script lang="ts">
	import '../app.css';
	let { children } = $props();

    import { onMount } from 'svelte';

    import { apiStore } from '$lib/forge.svelte.js';
	import { appData, Footer, UIShowcase, UrlDisplay } from '$lib/index.js';
    import Altharun from '$lib/components/dt/Altharun.svelte';


    onMount(() => {
        appData.init({  // Initialize app data
			name: 'Rune Lab 🌌',
            version: 'v0.0.3',
            description: 'Rune Lab is a web-based application for managing and visualizing data.',
            author: 'Yrrrrrf <fer.rezac@outlook.com>'
        });

        apiStore.init({  // Initialize API configuration
            // URL: 'http://3.88.132.195:8000',  // penchs xd
            // ^ do nothing to use localhost:8k port
            VERSION: 'v1',
            TIMEOUT: 30000
        });
    });

    // Meta tags derived from app data
    const metaTags = $derived([
        { name: 'application-name', content: appData.name },
        { name: 'author', content: appData.author },
        { name: 'description', content: appData.description },
    ]);
</script>

<svelte:head>
    <title>{appData.name}</title>
    {#each metaTags as meta}
        <meta name={meta.name} content={meta.content} />
    {/each}
</svelte:head>

<Altharun />

<!-- <UIShowcase /> -->

<div class="min-h-screen flex flex-col">
    <main class="flex-grow">
        {@render children()}
    </main>

    <Footer />
</div>

<UrlDisplay />
