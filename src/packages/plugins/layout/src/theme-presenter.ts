import type { ItemPresenter } from "rune-lab/core";
import { getKernel } from "rune-lab/ui";
import type { Theme } from "./stores/theme.svelte.ts";

const LABEL_OVERRIDES: Record<string, string> = {
	cmyk: "CMYK",
};

function themeLabel(name: string): string {
	if (name === "system") return "System";
	return LABEL_OVERRIDES[name] ?? name.charAt(0).toUpperCase() + name.slice(1);
}

export const themePresenter: ItemPresenter<Theme> = {
	get items() {
		try {
			const kernel = getKernel();
			const store = kernel.stores.get("rl:rune-lab.layout:theme") as
				| { available: Theme[] }
				| undefined;
			return store?.available ?? [];
		} catch {
			return [];
		}
	},
	id: (t) => t.name,
	present: (t) => ({ label: themeLabel(t.name) }),
};
