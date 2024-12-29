<!-- src/lib/components/layout/URLDisplay.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    // import { Book, Copy, CheckCircle, Terminal } from 'lucide-svelte';
    import { apiStore } from '$lib/stores/api.svelte';

    let copied = $state(false);
    let isVisible = $state(true);
    let lastScrollY = $state(0);
    let mounted = $state(false);

    onMount(() => {
        mounted = true;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            isVisible = currentScrollY < lastScrollY || currentScrollY < 100;
            lastScrollY = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    });

    function copyToClipboard() {
        navigator.clipboard.writeText(apiStore.baseUrl);
        copied = true;
        setTimeout(() => copied = false, 2000);
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter' || event.key === ' ') {
            copyToClipboard();
        }
    }

    function goToDocs() {
        window.open(`${apiStore.URL}/docs`, '_blank');
    }

    const containerClass = $derived(`
        fixed bottom-4 left-4 z-50 
        flex items-center space-x-2 
        transition-all duration-300 transform
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}
    `);
</script>

{#if mounted}
<div class={containerClass}>
    <div class="flex items-center space-x-2 backdrop-blur-sm bg-base-300/80 rounded-xl p-1">
        <!-- API Status Indicator -->
        <div class="tooltip" data-tip={apiStore.IS_CONNECTED ? 'Connected' : 'Disconnected'}>
            <div class={`w-2 h-2 rounded-full ${apiStore.IS_CONNECTED ? 'bg-success' : 'bg-error'}`}></div>
        </div>

        <!-- API Docs Button -->
        <button
            class="btn btn-circle btn-sm btn-primary"
            onclick={goToDocs}
            aria-label="Go to API Documentation"
        >
            <!-- <Book class="w-4 h-4" /> -->
        </button>

        <!-- <Terminal class="w-4 h-4 text-primary" /> -->

        <!-- API URL Display and Copy Button -->
        <button
            class="group flex items-center space-x-2 px-3 py-1 rounded-lg hover:bg-base-200 transition-colors duration-200"
            onclick={copyToClipboard}
            onkeydown={handleKeyDown}
            aria-label="Copy API URL"
        >
            <span class="text-xs font-mono">{apiStore.baseUrl}</span>
            {#if copied}
                <!-- <CheckCircle class="w-4 h-4 text-success" /> -->
            {:else}
                <!-- <Copy class="w-4 h-4 opacity-50 group-hover:opacity-100 transition-all duration-200" /> -->
            {/if}
        </button>
    </div>
</div>
{/if}