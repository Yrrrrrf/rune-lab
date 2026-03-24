import type { PersistenceDriver } from "@internal/core";
export interface WorkspaceItem {
  id: string;
  icon: string;
  label: string;
  badge?: string | number;
  href?: string;
  onClick?: () => void;
}
export interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  badge?: string | number;
  isActive?: boolean;
  onClick?: () => void;
  children?: NavigationItem[];
}
export interface NavigationSection {
  id: string;
  title: string;
  items: NavigationItem[];
}
export declare class LayoutStore {
  #private;
  workspaces: WorkspaceItem[];
  activeWorkspaceId: string | null;
  activeNavItemId: string | null;
  navOpen: boolean;
  detailOpen: boolean;
  collapsedSections: Set<string>;
  constructor(
    driver?: PersistenceDriver | (() => PersistenceDriver | undefined),
  );
  init(options?: {
    namespace?: string;
    driver?: PersistenceDriver;
  }): void;
  setWorkspaces(items: WorkspaceItem[]): void;
  activateWorkspace(id: string): void;
  activateWorkspaceByIndex(index: number): void;
  navigate(id: string): void;
  toggleNav(): void;
  toggleDetail(): void;
  toggleSection(id: string): void;
  collapseSection(id: string): void;
  expandSection(id: string): void;
}
export declare function createLayoutStore(
  driver?: PersistenceDriver | (() => PersistenceDriver | undefined),
): LayoutStore;
export declare function getLayoutStore(): LayoutStore;
