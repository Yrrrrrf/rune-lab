// src/lib/state/layout.svelte.ts
import { getLayoutStore } from "../../../kernel/src/mod.ts";
import type {
  NavigationItem,
  NavigationSection,
  PersistenceDriver,
  WorkspaceItem,
} from "../../../kernel/src/mod.ts";
import { resolveDriver } from "../../../kernel/src/mod.ts";

export type { NavigationItem, NavigationSection, WorkspaceItem };

export class LayoutStore {
  workspaces: WorkspaceItem[] = $state<WorkspaceItem[]>([]);
  activeWorkspaceId: string | null = $state<string | null>(null);
  activeNavItemId: string | null = $state<string | null>(null);
  navOpen: boolean = $state(true);
  detailOpen: boolean = $state(false);
  collapsedSections: Set<string> = $state<Set<string>>(new Set());

  #storageNamespace = "default";
  #initialized = false;
  #driver: PersistenceDriver | undefined;

  constructor(
    driver?: PersistenceDriver | (() => PersistenceDriver | undefined),
  ) {
    // Use resolveDriver but allow undefined result for SSR/no-driver scenarios
    this.#driver = driver ? resolveDriver(driver) : undefined;
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
): LayoutStore {
  return new LayoutStore(driver);
}

export { getLayoutStore };
