import { languageStore as _languageStore } from "$lib/state/language.svelte";
export type { Language } from "$lib/state/language.svelte";

if (import.meta.env?.DEV) {
  console.warn(
    '[DEPRECATED] Import from "$lib/features/config/stores/language.svelte" is deprecated. Use "$lib/state/language.svelte" instead.',
  );
}

export const languageStore = _languageStore;
