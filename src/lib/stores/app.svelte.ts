// src/lib/stores/app.svelte.ts
export interface AppData {
	name: string;
	version: string;
	description: string;
	author: string;
}

class AppStore {
	name = $state("Rune Lab");
	version = $state("0.0.0");
	description = $state("No description provided");
	author = $state("<Yrrrrrf>");

	init(data: Partial<AppData>) {
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

export const appData = new AppStore();
