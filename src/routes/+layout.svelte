<!-- src/routes/+layout.svelte -->
<script lang="ts">
    import '../app.css';
    import { onMount } from 'svelte';

    import { apiStore } from '$lib/mod.js';
    import { appData } from '$lib/mod.js';

    let { children } = $props();

    onMount(() => {
        console.log('🚀 App mounted');
        
        // // Initialize app data
        appData.init({
            name: 'Rune Lab',
            version: '0.1.0',
            description: 'A modern component library built with Svelte 5 Runes',
            author: 'Yrrrrrf'
        });
        
        // Initialize API store with configuration
        apiStore.init({
            url: 'http://3.88.132.195:8000',
            version: 'v1',
            maxRetries: 3,
            retryTimeout: 3000
        });
    });

    const metaTags = [
        { name: 'description', content: appData.description },
        { name: 'author', content: appData.author },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ];
</script>

<svelte:head>
    <title>{appData.name}</title>
    {#each metaTags as meta}
        <meta name={meta.name} content={meta.content} />
    {/each}
</svelte:head>

<!-- Main content -->
{@render children()}
