// src/lib/state/layout.svelte.ts

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

class LayoutStore {
  workspaces = $state<WorkspaceItem[]>([]);
  activeWorkspaceId = $state<string | null>(null);
  activeNavItemId = $state<string | null>(null);
  activeShowcaseTab = $state<number>(0);
  navOpen = $state(true);
  detailOpen = $state(false);
  collapsedSections = $state<Set<string>>(new Set());

  #storageNamespace = "default";
  #initialized = false;

  init(options?: { namespace?: string }) {
    if (this.#initialized) return;
    if (options?.namespace) this.#storageNamespace = options.namespace;

    if (typeof window !== "undefined") {
      const savedWorkspace = localStorage.getItem(
        `rl:layout:${this.#storageNamespace}:workspace`,
      );
      if (savedWorkspace) this.activeWorkspaceId = savedWorkspace;

      const savedSections = localStorage.getItem(
        `rl:layout:${this.#storageNamespace}:sections`,
      );
      if (savedSections) {
        try {
          this.collapsedSections = new Set(JSON.parse(savedSections));
        } catch (e) {
          console.error("Failed to parse collapsed sections", e);
        }
      }
    }

    this.#initialized = true;

    // Set up persistence effects
    $effect.root(() => {
      $effect(() => {
        if (this.activeWorkspaceId) {
          localStorage.setItem(
            `rl:layout:${this.#storageNamespace}:workspace`,
            this.activeWorkspaceId,
          );
        }
      });

      $effect(() => {
        localStorage.setItem(
          `rl:layout:${this.#storageNamespace}:sections`,
          JSON.stringify([...this.collapsedSections]),
        );
      });
    });
  }

  setWorkspaces(items: WorkspaceItem[]) {
    this.workspaces = items;
    if (items.length > 0 && !this.activeWorkspaceId) {
      this.activeWorkspaceId = items[0].id;
    }
  }

  activateWorkspace(id: string) {
    this.activeWorkspaceId = id;
  }

  activateWorkspaceByIndex(index: number) {
    const ws = this.workspaces[index];
    if (ws) {
      this.activateWorkspace(ws.id);
      ws.onClick?.();
    }
  }

  navigate(id: string) {
    this.activeNavItemId = id;
  }

  setShowcaseTab(index: number) {
    this.activeShowcaseTab = index;
  }

  toggleNav() {
    this.navOpen = !this.navOpen;
  }

  toggleDetail() {
    this.detailOpen = !this.detailOpen;
  }

  toggleSection(id: string) {
    if (this.collapsedSections.has(id)) {
      this.collapsedSections.delete(id);
    } else {
      this.collapsedSections.add(id);
    }
  }

  collapseSection(id: string) {
    this.collapsedSections.add(id);
  }

  expandSection(id: string) {
    this.collapsedSections.delete(id);
  }
}

export const layoutStore = new LayoutStore();
