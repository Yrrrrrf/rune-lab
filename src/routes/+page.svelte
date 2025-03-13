<script lang="ts">
    import { themeStore } from "$lib/mod.js";
    import { appData } from "$lib/stores/app.svelte.js";

    $effect(() => {
        appData.init({
            name: 'Rune Lab',
            version: '0.1.0',
            description: 'A modern component library built with Svelte 5 Runes',
            author: 'Yrrrrrf'
        });
        
        // Initialize theme
        themeStore.init();
    });
</script>

Rune Lab main content!