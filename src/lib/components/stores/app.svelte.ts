// src/lib/stores/app.svelte.ts
export interface AppData {
	name: string;
	version: string;
	description: string;
	author: string;
}

class AppStore {
	name: string = $state("Rune Lab");
	version: string = $state("0.1.0");
	description: string = $state(
		"Modern Svelte 5 UI components lib with powerful theming and API integration capabilities",
	);
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

export const appData: AppStore = new AppStore();
