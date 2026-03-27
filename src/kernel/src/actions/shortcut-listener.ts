import hotkeys from "hotkeys-js";
import { untrack } from "svelte";
import type { ShortcutStore } from "../../../runes/palettes/src/shortcuts/store.svelte.ts";

/**
 * Svelte Action to listen for shortcuts registered in shortcutStore.
 * Applied to the root element of the layout.
 */
export function shortcutListener(
  _node: HTMLElement,
  shortcutStore: ShortcutStore,
): { destroy(): void } {
  // Use $effect to reactively sync shortcuts
  const cleanup = $effect.root(() => {
    $effect(() => {
      // Unbind everything first to ensure clean state
      hotkeys.unbind();

      // We read entries here, so this effect re-runs when entries change.
      for (const entry of shortcutStore.entries) {
        // @ts-ignore: enabled might not be on the interface but we check it anyway
        if (entry.enabled === false) continue;

        hotkeys(entry.keys, "all", (event, _handler) => {
          // Check "when" predicate if it exists
          if (entry.when && !untrack(() => entry.when!())) {
            return;
          }

          entry.handler(event);
        });
      }
    });
  });

  return {
    destroy() {
      cleanup();
      hotkeys.unbind();
    },
  };
}
