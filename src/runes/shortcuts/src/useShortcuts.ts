// sdk/state/src/composables/useShortcuts.ts
// Declarative shortcut registration with automatic lifecycle cleanup.
// Bridges ShortcutConfig (sdk/core) → ShortcutStore (sdk/state).

import type { ShortcutConfig } from "@rune-lab/shortcuts";
import { getShortcutStore, type ShortcutEntry } from "../shortcuts.svelte.ts";

/**
 * Declarative shortcut registration composable.
 * Registers all shortcuts via ShortcutStore in a single `$effect` and
 * automatically unregisters them when the component is destroyed.
 *
 * Must be called at component initialization time (top-level in `<script>`),
 * not inside event handlers.
 *
 * @param configs - Array of ShortcutConfig from sdk/core
 * @returns Object with `registered` getter for the list of registered IDs
 *
 * @example
 * ```svelte
 * <script>
 *   import { useShortcuts } from '@rune-lab/shortcuts';
 *
 *   useShortcuts([
 *     {
 *       id: "save:document",
 *       keys: "ctrl+s",
 *       handler: (e) => { e.preventDefault(); save(); },
 *       label: "Save document",
 *       category: "Editing",
 *     },
 *   ]);
 * </script>
 * ```
 */
export function useShortcuts(configs: ShortcutConfig[]) {
  const shortcutStore = getShortcutStore();

  // Convert ShortcutConfig[] to ShortcutEntry[] respecting the `when` predicate
  function toEntries(configs: ShortcutConfig[]): ShortcutEntry[] {
    return configs.map((config) => ({
      id: config.id,
      keys: config.keys,
      handler: (event: KeyboardEvent) => {
        // Check `when` predicate before firing
        if (config.when && !config.when()) return;
        config.handler(event);
      },
      label: config.label ?? config.id,
      category: config.category ?? "General",
      scope: config.scope ?? "global",
      enabled: true,
      hidden: !config.label, // Hide from palette if no label
    }));
  }

  // Register all shortcuts
  const entries = toEntries(configs);
  const ids = entries.map((e) => e.id);

  for (const entry of entries) {
    shortcutStore.register(entry);
  }

  // Auto-cleanup using $effect.root for lifecycle management
  $effect(() => {
    // This effect runs on mount — shortcuts are already registered above.
    // Return cleanup that unregisters all shortcuts on destroy.
    return () => {
      for (const id of ids) {
        shortcutStore.unregister(id);
      }
    };
  });

  return {
    /** IDs of all shortcuts registered by this composable */
    get registered(): string[] {
      return ids;
    },
  };
}
