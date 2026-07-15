// Connection functions that generate reactive prop bindings from LayoutStore.
import type { LayoutStore } from "../stores/layout.svelte.ts";

export interface NavigationConnection {
  readonly activeId: string | null;
  readonly collapsedIds: Set<string>;
  onSelect: (item: { id?: string }) => void;
  onToggle: (id: string, isOpen: boolean) => void;
}

export interface WorkspaceConnection {
  readonly activeId: string | null;
  onSelect: (id: string) => void;
}

export function createNavigationConnection(
  layoutStore: Pick<
    LayoutStore,
    | "activeNavItemId"
    | "collapsedSections"
    | "navigate"
    | "expandSection"
    | "collapseSection"
  >,
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

export function createWorkspaceConnection(
  layoutStore: Pick<LayoutStore, "activeWorkspaceId" | "activateWorkspace">,
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
