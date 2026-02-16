import { commandStore as _commandStore } from "$lib/state/commands.svelte";
export type { Command } from "$lib/state/commands.svelte";

if (import.meta.env?.DEV) {
  console.warn(
    '[DEPRECATED] Import from "$lib/features/command-palette/commands.svelte" is deprecated. Use "$lib/state/commands.svelte" instead.',
  );
}

export const commandStore = _commandStore;
