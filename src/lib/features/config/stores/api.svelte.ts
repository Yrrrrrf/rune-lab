import { apiStore as _apiStore } from "$lib/state/api.svelte";

if (import.meta.env?.DEV) {
  console.warn(
    '[DEPRECATED] Import from "$lib/features/config/stores/api.svelte" is deprecated. Use "$lib/state/api.svelte" instead.',
  );
}

export const apiStore = _apiStore;
