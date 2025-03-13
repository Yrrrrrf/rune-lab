<script lang="ts">
    import { Brush } from "lucide-svelte";
    import { themeStore } from '$lib/stores/theme.svelte.js';

    // Local state using runes
    let showDropdown = $state(false);
    
    // Initialize theme on mount
    $effect(() => {
        themeStore.init();
    });
    
    // Get available themes
    const themes = themeStore.getAvailableThemes();

    function handleThemeSelect(themeName: string) {
        themeStore.setTheme(themeName);
        showDropdown = false;
    }
</script>

<div class="relative">
    <button 
        class="btn btn-ghost btn-circle"
        onclick={() => showDropdown = !showDropdown}
        aria-label="Select theme"
    >
        <span class="flex items-center gap-1">
            {#if themeStore.themeConfig.icon}
                <span>{themeStore.themeConfig.icon}</span>
            {:else}
                <Brush size={20} />
            {/if}
            <span>{themeStore.currentTheme}</span>
        </span>
    </button>

    {#if showDropdown}
        <div 
            class="fixed inset-0 z-10" 
            role="button"
            tabindex="0"
            onclick={() => showDropdown = false}
            onkeydown={(e) => e.key === 'Escape' && (showDropdown = false)}
        ></div>
        <ul class="absolute right-0 top-full mt-2 min-w-56 p-2 bg-base-100 border border-base-300 rounded-xl shadow-lg z-20 max-h-96 overflow-y-auto">
            {#each themes as theme}
                <li>
                    <button
                        class="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-base-200 transition-colors duration-200 rounded-lg
                               {themeStore.currentTheme === theme.name ? 'bg-base-300' : ''}"
                        onclick={() => handleThemeSelect(theme.name)}
                    >
                        <span>{theme.icon}</span>
                        <span class="capitalize">{theme.name}</span>
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
</div>