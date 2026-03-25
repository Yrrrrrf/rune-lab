// sdk/ui/src/lib/layout/connection-factory.ts
// Connection functions that generate reactive prop bindings from LayoutStore.
// Svelte 5 doesn't support React-style HOCs — this is the idiomatic alternative.

import type { LayoutStore } from "@rune-lab/kernel";

/**
 * Reactive prop binding for the NavigationPanel component.
 */
export interface NavigationConnection {
  /** Currently active navigation item ID */
  readonly activeId: string | null;
  /** Set of collapsed section IDs */
  readonly collapsedIds: Set<string>;
  /** Handler for when a navigation item is selected */
  onSelect: (item: { id?: string }) => void;
  /** Handler for when a section is toggled */
  onToggle: (id: string, isOpen: boolean) => void;
}

/**
 * Reactive prop binding for the WorkspaceStrip component.
 */
export interface WorkspaceConnection {
  /** Currently active workspace ID */
  readonly activeId: string | null;
  /** Handler for when a workspace is selected */
  onSelect: (id: string) => void;
}

/**
 * Creates reactive prop bindings for connecting NavigationPanel to LayoutStore.
 * Returns an object with getter properties that track LayoutStore state.
 *
 * @param layoutStore - The LayoutStore instance from context
 * @returns Prop bindings compatible with NavigationPanel
 *
 * @example
 * ```svelte
 * <script>
 *   const layoutStore = getLayoutStore();
 *   const nav = createNavigationConnection(layoutStore);
 * </script>
 * <NavigationPanel {sections} activeId={nav.activeId} collapsedIds={nav.collapsedIds}
 *   onSelect={nav.onSelect} onToggle={nav.onToggle} />
 * ```
 */
export function createNavigationConnection(
  layoutStore: LayoutStore,
): NavigationConnection {
  return {
    get activeId() {
      return layoutStore.activeNavItemId;
    },
    get collapsedIds() {
      return layoutStore.collapsedSections;
    },
    onSelect(item: { id?: string }) {
      if (item.id) layoutStore.navigate(item.id);
    },
    onToggle(id: string, isOpen: boolean) {
      if (isOpen) {
        layoutStore.expandSection(id);
      } else {
        layoutStore.collapseSection(id);
      }
    },
  };
}

/**
 * Creates reactive prop bindings for connecting WorkspaceStrip to LayoutStore.
 *
 * @param layoutStore - The LayoutStore instance from context
 * @returns Prop bindings compatible with WorkspaceStrip
 */
export function createWorkspaceConnection(
  layoutStore: LayoutStore,
): WorkspaceConnection {
  return {
    get activeId() {
      return layoutStore.activeWorkspaceId;
    },
    onSelect(id: string) {
      layoutStore.activateWorkspace(id);
    },
  };
}
