<script lang="ts">
    import { STATIC_THEMES } from "./constants";

    let currentTheme = $state(getCurrentTheme());
    
    // Get the current theme from HTML data-theme attribute
    function getCurrentTheme(): string {
        if (typeof document !== 'undefined') {
            return document.documentElement.getAttribute('data-theme') || 'light';
        }
        return 'light';
    }
    
    // Create a map of theme name to config for quick lookup
    const themeMap = new Map(STATIC_THEMES.map(theme => [theme.name, theme]));

    // Get current theme config
    let themeConfig = $derived(themeMap.get(currentTheme) || { 
        name: currentTheme, 
        icon: "🎨",
        description: "Custom theme" 
    });
</script>

<div class="dropdown dropdown-bottom">
    <div 
        tabindex="0" 
        role="button" 
        class="btn btn-ghost btn-circle"
        aria-label="Select theme"
    >
        <span class="flex items-center justify-center">
            <span class="text-lg">{themeConfig.icon}</span>
        </span>
    </div>

    <div class="dropdown-content z-30 menu p-3 bg-base-200 border border-base-300 rounded-box shadow-xl mt-2 w-64 max-h-96 overflow-y-auto">
        <ul class="menu bg-base-100 rounded-box w-full">
            {#each STATIC_THEMES as theme}
                <li>
                    <label class="flex items-center gap-2 hover:bg-base-200 active:bg-base-300 transition-colors duration-200">
                        <input 
                            type="radio" 
                            name="theme-dropdown" 
                            class="theme-controller radio radio-xs" 
                            value={theme.name}
                        />
                        <span class="text-xl">{theme.icon}</span>
                        <span class="capitalize">{theme.name}</span>
                    </label>
                </li>
            {/each}
        </ul>
    </div>
</div>
