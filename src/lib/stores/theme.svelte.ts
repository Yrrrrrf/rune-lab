import { STATIC_THEMES as THEMES, type ThemeConfig } from "../core/theme/constants.ts";
import { availableThemes as _availableThemes } from "../core/theme/constants.ts";

// Type definitions for browser environment
type Window = typeof globalThis & {
	localStorage?: {
		getItem(key: string): string | null;
		setItem(key: string, value: string): void;
	};
};

type Document = {
	documentElement: {
		setAttribute(name: string, value: string): void;
	};
};

// Global variables with type safety
declare const window: Window | undefined;
declare const document: Document | undefined;

export class ThemeStore {
	// Add explicit type annotations to all properties
	currentTheme: string = $state("dracula");

	// Track if we've initialized
	private _initialized: boolean = $state(false);

	constructor() {
		// No DOM operations in constructor for SSR compatibility
	}

	init(): ThemeStore {
		if (this._initialized) return this;

		if (typeof window !== "undefined" && window.localStorage) {
			const savedTheme = window.localStorage.getItem("theme") || "dracula";
			this.setTheme(savedTheme);
			this._initialized = true;
		}

		return this;
	}

	setTheme(theme: string): void {
		this.currentTheme = theme;

		// Safe DOM operations with proper type checking
		if (
			typeof window !== "undefined" && window.localStorage &&
			typeof document !== "undefined" && document.documentElement
		) {
			window.localStorage.setItem("theme", theme);
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

// Export singleton instance with explicit type
export const themeStore: ThemeStore = new ThemeStore();
