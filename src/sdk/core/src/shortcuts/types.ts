// sdk/core/src/shortcuts/types.ts
// Framework-agnostic shortcut configuration types.
// The composable layer (sdk/state) wraps these in Svelte 5 lifecycle management.

/**
 * Declarative shortcut configuration.
 * Used by the `useShortcuts` composable to register shortcuts with automatic cleanup.
 *
 * @example
 * ```ts
 * const shortcuts: ShortcutConfig[] = [
 *   {
 *     id: "save:document",
 *     keys: "ctrl+s",
 *     handler: () => save(),
 *     label: "Save document",
 *     category: "Editing",
 *   },
 *   {
 *     id: "palette:open",
 *     keys: "ctrl+k",
 *     handler: () => openPalette(),
 *     when: () => !isModalOpen,
 *   },
 * ];
 * ```
 */
export interface ShortcutConfig {
  /**
   * Unique dot-namespaced identifier.
   * Must be namespaced by feature to prevent collisions in the global registry.
   * @example "save:document", "palette:open"
   */
  id: string;

  /**
   * Hotkeys.js-compatible key combination string.
   * @example "ctrl+s", "alt+shift+p", "escape"
   */
  keys: string;

  /**
   * Handler function invoked when the shortcut is triggered.
   */
  handler: (event: KeyboardEvent) => void;

  /**
   * Optional predicate — when provided, the shortcut only fires if this returns `true`.
   * Useful for context-dependent shortcuts (e.g., only when a modal is closed).
   */
  when?: () => boolean;

  /**
   * Human-readable label for display in the shortcut palette.
   * If omitted, the shortcut is registered but hidden from the palette.
   */
  label?: string;

  /**
   * Display category (e.g., "Navigation", "Editing") for grouping in the palette.
   */
  category?: string;

  /**
   * Scope in which the shortcut is active.
   * @default "global"
   */
  scope?: "global" | "layout" | `panel:${string}`;
}
