import { toastStore as _toastStore } from "$lib/state/toast.svelte";

if (import.meta.env?.DEV) {
  console.warn(
    '[DEPRECATED] Import from "$lib/features/config/stores/toast.svelte" is deprecated. Use "$lib/state/toast.svelte" instead.',
  );
}

export const toastStore = _toastStore;
