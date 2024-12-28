import { 
    THEMES_CONFIG, 
    staticThemes,
    type ThemeConfig 
} from "./../theme/static.js";


class ThemeStore {
    // State management with runes
    currentTheme = $state(this.getInitialTheme());

    private getInitialTheme(): string {
        if (typeof window === 'undefined') return 'light';
        return localStorage?.getItem('theme') || 'light';
    }

    private createThemeConfig(themeName: string): ThemeConfig {
        const config = THEMES_CONFIG[themeName as keyof typeof THEMES_CONFIG];
        return {
            name: themeName.charAt(0).toUpperCase() + themeName.slice(1),
            value: themeName,
            icon: config?.icon || '🎨',
            description: config?.description || `${themeName} theme`
        };
    }

    getAvailableThemes(): ThemeConfig[] {
        return staticThemes.map(theme => this.createThemeConfig(theme));
    }

    setTheme(theme: string) {
        if (typeof window === 'undefined') return;
        
        this.currentTheme = theme;
        localStorage?.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }

    // Initialize theme system
    init() {
        if (typeof window === 'undefined') return;
        
        $effect(() => {
            document.documentElement.setAttribute('data-theme', this.currentTheme);
        });

        return this.currentTheme;
    }

    // Get current theme configuration
    get themeConfig(): ThemeConfig {
        return this.createThemeConfig(this.currentTheme);
    }
}

// Export a singleton instance
export const themeStore = new ThemeStore();
