// src/lib/state/layout.svelte.ts
import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "$lib/context";
import type { PersistenceDriver } from "$lib/persistence/types";

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

export class LayoutStore {
  workspaces = $state<WorkspaceItem[]>([]);
  activeWorkspaceId = $state<string | null>(null);
  activeNavItemId = $state<string | null>(null);
  navOpen = $state(true);
  detailOpen = $state(false);
  collapsedSections = $state<Set<string>>(new Set());

  #storageNamespace = "default";
  #initialized = false;
  #driver: PersistenceDriver | undefined;

  constructor(
    driver?: PersistenceDriver | (() => PersistenceDriver | undefined),
  ) {
    // We import locally here or at top-level. We can just fallback to window if undefined,
    // but better to expect it via inject. The app supplies it in createLayoutStore.
    this.#driver = (typeof driver === "function" ? driver() : driver) as
      | PersistenceDriver
      | undefined;
  }

  init(options?: { namespace?: string; driver?: PersistenceDriver }) {
    if (this.#initialized) return;
    if (options?.namespace) this.#storageNamespace = options.namespace;
    if (options?.driver) this.#driver = options.driver;

    // If no driver was injected and no window (SSR), we just do nothing
    if (!this.#driver && typeof window !== "undefined") {
      this.#driver = {
        get: (key: string) => localStorage.getItem(key),
        set: (key: string, val: string) => localStorage.setItem(key, val),
        remove: (key: string) => localStorage.removeItem(key),
      };
    }

    if (this.#driver) {
      const savedWorkspace = this.#driver.get(
        `rl:layout:${this.#storageNamespace}:workspace`,
      );
      if (savedWorkspace) this.activeWorkspaceId = savedWorkspace;

      const savedSections = this.#driver.get(
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
    if (this.#driver) {
      $effect.root(() => {
        $effect(() => {
          if (this.activeWorkspaceId) {
            this.#driver?.set(
              `rl:layout:${this.#storageNamespace}:workspace`,
              this.activeWorkspaceId,
            );
          }
        });

        $effect(() => {
          this.#driver?.set(
            `rl:layout:${this.#storageNamespace}:sections`,
            JSON.stringify([...this.collapsedSections]),
          );
        });
      });
    }
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

export function createLayoutStore(
  driver?: PersistenceDriver | (() => PersistenceDriver | undefined),
) {
  return new LayoutStore(driver);
}

export function getLayoutStore() {
  return getContext<LayoutStore>(RUNE_LAB_CONTEXT.layout);
}
