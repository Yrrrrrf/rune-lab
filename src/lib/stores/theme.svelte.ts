/// <reference lib="dom" />

import { type ThemeConfig, THEMES } from "../core/theme/constants.ts";
import { availableThemes as _availableThemes } from "../core/theme/constants.ts";

export class ThemeStore {
	// State using Runes
	currentTheme = $state("dracula");

	// Track if we've initialized
	private _initialized = $state(false);

	constructor() {
		// No DOM operations in constructor for SSR compatibility
	}

	init() {
		if (this._initialized) return;

		if (typeof window !== "undefined") {
			const savedTheme = localStorage.getItem("theme") || "dracula";
			this.setTheme(savedTheme);
			this._initialized = true;
		}

		return this;
	}

	setTheme(theme: string) {
		// Check against available themes if needed
		// todo: Check if this is needed...
		// if (!_availableThemes.includes(theme)) {
		//    console.warn(`Theme "${theme}" not found, using default theme.`);
		//    theme = 'dracula';
		// }

		this.currentTheme = theme;

		if (typeof window !== "undefined" && typeof document !== "undefined") {
			localStorage.setItem("theme", theme);
			document.documentElement.setAttribute("data-theme", theme);
		}
	}

	getAvailableThemes(): ThemeConfig[] {
		return THEMES;
	}

	get themeConfig(): ThemeConfig {
		return THEMES.find((t) => t.name === this.currentTheme) || THEMES[0];
	}
}

// Export singleton instance
export const themeStore = new ThemeStore();
