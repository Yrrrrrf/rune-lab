import { THEMES, availableThemes, type ThemeConfig } from "./../theme/static.js";

class ThemeStore {
    // State management with runes
    currentTheme = $state(this.getInitialTheme());

    private getInitialTheme(): string {
        if (typeof window === 'undefined') return 'dracula';
        return localStorage?.getItem('theme') || 'dracula';
    }

    setTheme(theme: string) {
        if (typeof window === 'undefined') return;
        
        console.log('Setting theme to:', theme);
        this.currentTheme = theme;
        localStorage?.setItem('theme', theme);
        // Let's try setting it directly here as well
        document.documentElement.setAttribute('data-theme', theme);
        console.log('Current theme after setting:', this.currentTheme);
        console.log('Current data-theme attribute:', document.documentElement.getAttribute('data-theme'));
    }

    init() {
        if (typeof window === 'undefined') return;
        
        $effect(() => {
            console.log('Effect running, current theme:', this.currentTheme);
            document.documentElement.setAttribute('data-theme', this.currentTheme);
            console.log('Theme attribute after effect:', document.documentElement.getAttribute('data-theme'));
        });

        return this.currentTheme;
    }
    private createThemeConfig(themeName: string): ThemeConfig {
        const config = THEMES.find(theme => theme.name === themeName);
        return {
            name: themeName.charAt(0).toUpperCase() + themeName.slice(1),
            icon: config?.icon || '🎨',
            description: config?.description || `${themeName} theme`
        };
    }
    

    getAvailableThemes(): ThemeConfig[] {
        return availableThemes.map(theme => this.createThemeConfig(theme));
    }

    // Get current theme configuration
    get themeConfig(): ThemeConfig {
        return this.createThemeConfig(this.currentTheme);
    }
}

// Export a singleton instance
export const themeStore = new ThemeStore();
