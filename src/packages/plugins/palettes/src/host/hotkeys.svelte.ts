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
  let bound: string[] = [];
  const unbindOwn = () => {
    for (const keys of bound) hotkeys.unbind(keys, "all");
    bound = [];
  };

  const cleanup = $effect.root(() => {
    $effect(() => {
      unbindOwn();
      for (const entry of shortcutStore.entries) {
        if (entry.enabled === false) continue;
        hotkeys(entry.keys, "all", (event) => {
          if (entry.when && !untrack(() => entry.when?.())) {
            return;
          }
          entry.handler(event);
        });
        bound.push(entry.keys);
      }
    });
  });

  return () => {
    cleanup();
    unbindOwn();
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
