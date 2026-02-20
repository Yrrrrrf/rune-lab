import hotkeys from "hotkeys-js";
import { untrack, getContext } from "svelte";



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
export const LAYOUT_SHORTCUTS = {
  TOGGLE_NAV: {
    id: "rl:layout:toggle-nav",
    keys: "ctrl+\\",
    label: "Toggle Navigation Panel",
    category: "Layout",
    scope: "global",
  },
  TOGGLE_DETAIL: {
    id: "rl:layout:toggle-detail",
    keys: "ctrl+shift+\\",
    label: "Toggle Detail Panel",
    category: "Layout",
    scope: "global",
  },
  ...Object.fromEntries(
    Array.from({ length: 9 }, (_, i) => [
      `WORKSPACE_${i + 1}`,
      {
        id: `rl:layout:workspace-${i + 1}`,
        keys: `ctrl+${i + 1}`,
        label: `Jump to Workspace ${i + 1}`,
        category: "Navigation",
        scope: "global",
      },
    ]),
  ),
  OPEN_SHORTCUTS: {
    id: "rl:shortcuts:open",
    keys: "ctrl+/",
    label: "Show Shortcut Palette",
    category: "Help",
    scope: "global",
  },
  NAV_NEXT: {
    id: "rl:nav:next-item",
    keys: "alt+down",
    label: "Next navigation item",
    category: "Navigation",
    scope: "panel:navigation",
  },
  NAV_PREV: {
    id: "rl:nav:prev-item",
    keys: "alt+up",
    label: "Previous navigation item",
    category: "Navigation",
    scope: "panel:navigation",
  },
  NAV_EXPAND: {
    id: "rl:nav:expand-section",
    keys: "alt+right",
    label: "Expand section",
    category: "Navigation",
    scope: "panel:navigation",
  },
  NAV_COLLAPSE: {
    id: "rl:nav:collapse-section",
    keys: "alt+left",
    label: "Collapse section",
    category: "Navigation",
    scope: "panel:navigation",
  },
} as const;

export class ShortcutStore {

  /** All registered shortcuts */
  entries = $state<ShortcutEntry[]>([]);

  /** Whether the shortcut palette is currently visible */
  showPalette = $state(false);

  /** Subset of shortcuts that should be displayed in the palette */
  active = $derived(
    this.entries.filter((e) => e.enabled !== false && !e.hidden),
  );

  /** Grouped entries for display (scope -> category -> entries) */
  byScopeAndCategory = $derived.by(() => {
    const groups: Record<string, Record<string, ShortcutEntry[]>> = {};
    for (const entry of this.active) {
      const scope = entry.scope;
      const category = entry.category;
      if (!groups[scope]) groups[scope] = {};
      if (!groups[scope][category]) groups[scope][category] = [];
      groups[scope][category].push(entry);
    }
    return groups;
  });

  /** Scopes sorted by importance (global first, then layout, then alphabetical) */
  sortedScopes = $derived.by(() => {
    return Object.keys(this.byScopeAndCategory).sort((a, b) => {
      if (a === "global") return -1;
      if (b === "global") return 1;
      if (a === "layout") return -1;
      if (b === "layout") return 1;
      return a.localeCompare(b);
    });
  });

  /**
   * Register a new shortcut
   */
  register(entry: ShortcutEntry): void {
    untrack(() => {
      const existingIndex = this.entries.findIndex((e) => e.id === entry.id);

      if (existingIndex !== -1) {
        if (import.meta.env?.DEV) {
          console.warn(
            `[ShortcutStore] Overwriting shortcut ID "${entry.id}"`,
            {
              old: this.entries[existingIndex],
              new: entry,
            },
          );
        }
        this.entries[existingIndex] = { enabled: true, ...entry };
        return;
      }

      // Check for collisions (keys + scope)
      const collision = this.entries.find(
        (e) => e.keys === entry.keys && e.scope === entry.scope,
      );
      if (collision && import.meta.env?.DEV) {
        console.warn(
          `[ShortcutStore] Collision detected for keys "${entry.keys}" in scope "${entry.scope}". ` +
          `ID "${entry.id}" will displace "${collision.id}".`,
        );
      }

      this.entries.push({ enabled: true, ...entry });
    });
  }

  /**
   * Unregister a shortcut by ID
   */
  unregister(id: string): void {
    untrack(() => {
      this.entries = this.entries.filter((e) => e.id !== id);
    });
  }

  /**
   * Enable a shortcut
   */
  enable(id: string): void {
    untrack(() => {
      const entry = this.entries.find((e) => e.id === id);
      if (entry) entry.enabled = true;
    });
  }

  /**
   * Disable a shortcut
   */
  disable(id: string): void {
    untrack(() => {
      const entry = this.entries.find((e) => e.id === id);
      if (entry) entry.enabled = false;
    });
  }

  /**
   * Find conflicts for a given key combo and scope
   */
  findConflicts(keys: string, scope: string): ShortcutEntry[] {
    return untrack(() =>
      this.entries.filter((e) => e.keys === keys && e.scope === scope)
    );
  }
}

/**
 * Svelte Action to listen for shortcuts registered in shortcutStore.
 * Applied to the root element of the layout.
 */
export function shortcutListener(
  node: HTMLElement,
  shortcutStore: ShortcutStore,
) {
  // Use $effect to reactively sync shortcuts
  const cleanup = $effect.root(() => {
    $effect(() => {
      // Unbind everything first to ensure clean state
      hotkeys.unbind();

      // We read entries here, so this effect re-runs when entries change.
      // That's exactly what we want.
      for (const entry of shortcutStore.entries) {

        if (entry.enabled === false) continue;

        hotkeys(entry.keys, "all", (event, handler) => {
          // Scoping logic: check if the event target is within the required scope
          if (entry.scope === "global") {
            // Hotkeys.js already filters inputs by default
            entry.handler(event);
          } else if (entry.scope === "layout") {
            if (node.contains(event.target as Node)) {
              entry.handler(event);
            }
          } else if (entry.scope.startsWith("panel:")) {
            const panelId = entry.scope.replace("panel:", "");
            const panel = node.querySelector(`[data-rl-panel="${panelId}"]`);
            if (panel && panel.contains(event.target as Node)) {
              entry.handler(event);
            }
          }
        });
      }
    });

    // Helper to sync hotkeys-js scope with focus
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const panel = target.closest("[data-rl-panel]");
      if (panel) {
        const scope = `panel:${panel.getAttribute("data-rl-panel")}`;
        hotkeys.setScope(scope);
      } else if (node.contains(target)) {
        hotkeys.setScope("layout");
      } else {
        hotkeys.setScope("global");
      }
    };

    window.addEventListener("focusin", handleFocusIn);

    return () => {
      window.removeEventListener("focusin", handleFocusIn);
    };
  });

  return {
    destroy() {
      cleanup();
      hotkeys.unbind();
    },
  };
}

export function createShortcutStore() {
  return new ShortcutStore();
}

export function getShortcutStore() {
  return getContext<ShortcutStore>("rl:shortcut");
}

