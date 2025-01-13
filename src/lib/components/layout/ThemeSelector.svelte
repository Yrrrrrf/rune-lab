<script lang="ts">
    import { themeStore } from '../../stores/theme.svelte.js';
    
    // Local state using runes
    let showDropdown = $state(false);
    
    // Initialize theme on mount
    themeStore.init();
    
    // Get available themes
    const themes = themeStore.getAvailableThemes();

    function handleThemeSelect(themeName: string) {
        themeStore.setTheme(themeName);
        showDropdown = false;
    }
</script>

<div class="relative">
    <button 
        class="btn"
        onclick={() => showDropdown = !showDropdown}
    >
        <span>{themeStore.themeConfig.icon}</span>
    </button>

    {#if showDropdown}
        <ul class="absolute right-0 top-full mt-2 min-w-[150px] p-2 bg-base-100 border border-base-300 rounded-lg shadow-lg">
            {#each themes as theme}
                <li>
                    <button
                        class="w-full flex items-center gap-2 px-2 py-2 text-left hover:bg-base-200 transition-colors duration-200 rounded-lg
                               {themeStore.currentTheme === theme.name ? 'bg-base-300' : ''}"
                        onclick={() => handleThemeSelect(theme.name)}
                    >
                        <span>{theme.icon}</span>
                        <span>{theme.name}</span>
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
</div>