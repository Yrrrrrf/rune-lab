// src/lib/stores/app.svelte.ts
export interface AppData {
	name: string;
	version: string;
	description: string;
	author: string;
}

class AppStore {
	// Add explicit type annotations to all properties
	name: string = $state("Rune Lab");
	version: string = $state("0.0.0");
	description: string = $state("No description provided");
	author: string = $state("<Yrrrrrf>");

	init(data: Partial<AppData>): void {
		if (data.name) this.name = data.name;
		if (data.version) this.version = data.version;
		if (data.description) this.description = data.description;
		if (data.author) this.author = data.author;

		console.clear();
		console.log("🔮 App initialized:", {
			name: this.name,
			version: this.version,
			description: this.description,
			author: this.author,
		});
	}
}

// Export with explicit type annotation
export const appData: AppStore = new AppStore();
