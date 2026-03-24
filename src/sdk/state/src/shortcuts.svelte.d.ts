/**
 * Metadata for a keyboard shortcut
 */
export interface ShortcutMeta {
  /** Unique dot-namespaced identifier (e.g. "rl:layout:toggle-nav") */
  id: string;
  /** Hotkeys.js-compatible key string (e.g. "ctrl+\\", "alt+down") */
  keys: string;
  /** Human-readable description shown in the Shortcut Palette */
  label: string;
  /** Display group within a scope (e.g. "Layout", "Navigation") */
  category: string;
  /** When the shortcut is eligible to fire */
  scope: "global" | "layout" | `panel:${string}`;
  /** Whether the shortcut is currently active in the execution engine */
  enabled?: boolean;
  /** Whether to hide the shortcut from the Shortcut Palette */
  hidden?: boolean;
}
/**
 * Descriptor for a keyboard shortcut with handler
 */
export interface ShortcutEntry extends ShortcutMeta {
  /** The function to execute when the shortcut is triggered */
  handler: (event: KeyboardEvent) => void;
}
/**
 * Built-in layout shortcuts
 */
export declare const LAYOUT_SHORTCUTS: {
  readonly TOGGLE_NAV: {
    readonly id: "rl:layout:toggle-nav";
    readonly keys: "ctrl+\\";
    readonly label: "Toggle Navigation Panel";
    readonly category: "Layout";
    readonly scope: "global";
  };
  readonly TOGGLE_DETAIL: {
    readonly id: "rl:layout:toggle-detail";
    readonly keys: "ctrl+shift+\\";
    readonly label: "Toggle Detail Panel";
    readonly category: "Layout";
    readonly scope: "global";
  };
  readonly OPEN_SHORTCUTS: {
    readonly id: "rl:shortcuts:open";
    readonly keys: "ctrl+/";
    readonly label: "Show Shortcut Palette";
    readonly category: "Help";
    readonly scope: "global";
  };
  readonly NAV_NEXT: {
    readonly id: "rl:nav:next-item";
    readonly keys: "alt+down";
    readonly label: "Next navigation item";
    readonly category: "Navigation";
    readonly scope: "panel:navigation";
  };
  readonly NAV_PREV: {
    readonly id: "rl:nav:prev-item";
    readonly keys: "alt+up";
    readonly label: "Previous navigation item";
    readonly category: "Navigation";
    readonly scope: "panel:navigation";
  };
  readonly NAV_EXPAND: {
    readonly id: "rl:nav:expand-section";
    readonly keys: "alt+right";
    readonly label: "Expand section";
    readonly category: "Navigation";
    readonly scope: "panel:navigation";
  };
  readonly NAV_COLLAPSE: {
    readonly id: "rl:nav:collapse-section";
    readonly keys: "alt+left";
    readonly label: "Collapse section";
    readonly category: "Navigation";
    readonly scope: "panel:navigation";
  };
};
export declare class ShortcutStore {
  /** All registered shortcuts */
  entries: ShortcutEntry[];
  /** Whether the shortcut palette is currently visible */
  showPalette: boolean;
  /** Subset of shortcuts that should be displayed in the palette */
  active: ShortcutEntry[];
  /** Grouped entries for display (scope -> category -> entries) */
  byScopeAndCategory: Record<string, Record<string, ShortcutEntry[]>>;
  /** Scopes sorted by importance (global first, then layout, then alphabetical) */
  sortedScopes: string[];
  /**
   * Register a new shortcut
   */
  register(entry: ShortcutEntry): void;
  /**
   * Unregister a shortcut by ID
   */
  unregister(id: string): void;
  /**
   * Enable a shortcut
   */
  enable(id: string): void;
  /**
   * Disable a shortcut
   */
  disable(id: string): void;
  /**
   * Find conflicts for a given key combo and scope
   */
  findConflicts(keys: string, scope: string): ShortcutEntry[];
}
/**
 * Svelte Action to listen for shortcuts registered in shortcutStore.
 * Applied to the root element of the layout.
 */
export declare function shortcutListener(
  node: HTMLElement,
  shortcutStore: ShortcutStore,
): {
  destroy(): void;
};
export declare function createShortcutStore(): ShortcutStore;
export declare function getShortcutStore(): ShortcutStore;
