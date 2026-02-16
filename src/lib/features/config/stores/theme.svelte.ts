import { themeStore as _themeStore } from "$lib/state/theme.svelte";
export type { Theme } from "$lib/state/theme.svelte";

if (import.meta.env?.DEV) {
  console.warn(
    '[DEPRECATED] Import from "$lib/features/config/stores/theme.svelte" is deprecated. Use "$lib/state/theme.svelte" instead.',
  );
}

export const themeStore = _themeStore;
