import type { ItemPresenter } from "rune-lab/core";
import { getLanguageName, type Language, LANGUAGES } from "./store.svelte.ts";

export const languagePresenter: ItemPresenter<Language> = {
  items: LANGUAGES as unknown as Language[],
  id: (l) => l.code,
  present: (l) => ({ label: getLanguageName(l), icon: l.flag }),
};
