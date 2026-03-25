import type { ShortcutConfig } from "@rune-lab/core";
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
 *   import { useShortcuts } from 'rune-lab/state';
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
export declare function useShortcuts(configs: ShortcutConfig[]): {
  /** IDs of all shortcuts registered by this composable */
  readonly registered: string[];
};
