import type { ItemPresenter } from "rune-lab/core";
import { getKernel } from "rune-lab/ui";
import { getLanguageName, type Language } from "./store.svelte.ts";

export const languagePresenter: ItemPresenter<Language> = {
	get items() {
		try {
			const kernel = getKernel();
			const store = kernel.stores.get("rl:rune-lab.i18n:language") as
				| { available: Language[] }
				| undefined;
			return store?.available ?? [];
		} catch {
			return [];
		}
	},
	id: (l) => l.code,
	present: (l) => ({ label: getLanguageName(l), icon: l.flag }),
};
