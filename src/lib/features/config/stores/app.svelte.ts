import { appStore as _appStore } from "$lib/state/app.svelte";
export type { AppData } from "$lib/state/app.svelte";

if (import.meta.env?.DEV) {
  console.warn(
    '[DEPRECATED] Import from "$lib/features/config/stores/app.svelte" is deprecated. Use "$lib/state/app.svelte" instead.',
  );
}

export const appStore = _appStore;
