import hotkeys from "hotkeys-js";
import { untrack } from "svelte";

export interface ShortcutStoreLike {
  entries: {
    enabled?: boolean;
    keys: string;
    when?: () => boolean;
    handler: (event: KeyboardEvent) => void;
  }[];
}

export function bindShortcuts(shortcutStore: ShortcutStoreLike): () => void {
  const cleanup = $effect.root(() => {
    $effect(() => {
      hotkeys.unbind();
      for (const entry of shortcutStore.entries) {
        if (entry.enabled === false) continue;
        hotkeys(entry.keys, "all", (event) => {
          if (entry.when && !untrack(() => entry.when?.())) {
            return;
          }
          entry.handler(event);
        });
      }
    });
  });

  return () => {
    cleanup();
    hotkeys.unbind();
  };
}

export function shortcutListener(
  _node: HTMLElement,
  shortcutStore: ShortcutStoreLike,
): { destroy(): void } {
  const unbind = bindShortcuts(shortcutStore);
  return {
    destroy() {
      unbind();
    },
  };
}
