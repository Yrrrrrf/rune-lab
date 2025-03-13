// src/lib/stores/footer.svelte.ts

export interface FooterLink {
	text: string;
	href: string;
}

export interface FooterSection {
	title: string;
	links: FooterLink[];
}

export interface FooterConfig {
	sections: FooterSection[];
	socialLinks: {
		github?: string;
		twitter?: string;
		linkedin?: string;
	};
	showSocialLinks: boolean;
	showVersion: boolean;
	showCopyright: boolean;
}

const defaultConfig: FooterConfig = {
	sections: [],
	socialLinks: {},
	showSocialLinks: false,
	showVersion: false,
	showCopyright: false,
};

class FooterStore {
	// State management with explicit type annotations
	private _config: FooterConfig = $state({ ...defaultConfig });

	// Getter for the config to avoid direct state access
	get config(): FooterConfig {
		return this._config;
	}

	// Initialize with custom configuration
	init(config: Partial<FooterConfig>): FooterStore {
		this._config = {
			sections: config.sections || [],
			socialLinks: config.socialLinks || {},
			showSocialLinks: config.showSocialLinks ?? false,
			showVersion: config.showVersion ?? false,
			showCopyright: config.showCopyright ?? false,
		};
		return this;
	}

	// Set default state
	reset(): FooterStore {
		this._config = { ...defaultConfig };
		return this;
	}

	// Section management
	addSection(section: FooterSection): FooterStore {
		this._config.sections = [...this._config.sections, section];
		return this;
	}

	updateSection(index: number, section: FooterSection): FooterStore {
		if (index >= 0 && index < this._config.sections.length) {
			const newSections = [...this._config.sections];
			newSections[index] = section;
			this._config.sections = newSections;
		}
		return this;
	}

	removeSection(index: number): FooterStore {
		this._config.sections = this._config.sections.filter((_, i) => i !== index);
		return this;
	}

	clearSections(): FooterStore {
		this._config.sections = [];
		return this;
	}

	// Social links management
	updateSocialLinks(links: Partial<FooterConfig["socialLinks"]>): FooterStore {
		this._config.socialLinks = { ...this._config.socialLinks, ...links };
		return this;
	}

	// Show/Hide features
	showSocialLinks(show: boolean): FooterStore {
		this._config.showSocialLinks = show;
		return this;
	}

	showVersion(show: boolean): FooterStore {
		this._config.showVersion = show;
		return this;
	}

	showCopyright(show: boolean): FooterStore {
		this._config.showCopyright = show;
		return this;
	}
}

// Export singleton instance with explicit type
export const footerStore: FooterStore = new FooterStore();
