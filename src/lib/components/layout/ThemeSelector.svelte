<script lang="ts">
    import { themeStore } from '$lib/stores/theme.svelte.js';
    
    // Local state using runes
    let showDropdown = $state(false);
    
    // Initialize theme on mount
    themeStore.init();
    
    // Get available themes
    const themes = themeStore.getAvailableThemes();

    function handleThemeSelect(themeValue: string) {
        themeStore.setTheme(themeValue);
        showDropdown = false;
    }
</script>

<div class="theme-selector">
    <button 
        class="btn"
        onclick={() => showDropdown = !showDropdown}
    >
        <span>{themeStore.themeConfig.icon}</span>
    </button>

    {#if showDropdown}
        <ul class="theme-menu">
            {#each themes as theme}
                <li>
                    <button
                        class="theme-option"
                        class:active={themeStore.currentTheme === theme.value}
                        onclick={() => handleThemeSelect(theme.value)}
                    >
                        <span>{theme.icon}</span>
                        <span>{theme.name}</span>
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .theme-selector {
        position: relative;
    }

    .theme-menu {
        position: absolute;
        right: 0;
        top: 100%;
        margin-top: 0.5rem;
        background: var(--background);
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        padding: 0.5rem;
        min-width: 150px;
    }

    .theme-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        width: 100%;
        text-align: left;
    }

    .theme-option:hover {
        background: var(--hover);
    }

    .active {
        background: var(--active);
    }
</style>
