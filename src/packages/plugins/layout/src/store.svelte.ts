// src/state/layout.svelte.ts
import type { PersistenceDriver } from "@rune-lab/svelte";
import { resolveDriver } from "@rune-lab/svelte";
import type { WorkspaceItem } from "./types.ts";

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
      if (savedWorkspace) {
        if (savedWorkspace instanceof Promise) {
          savedWorkspace.then((val) => {
            if (val) this.activeWorkspaceId = val;
          });
        } else {
          this.activeWorkspaceId = savedWorkspace;
        }
      }

      const savedSections = this.#driver.get(
        `rl:layout:${this.#storageNamespace}:sections`,
      );
      if (savedSections) {
        if (savedSections instanceof Promise) {
          savedSections.then((val) => {
            if (val) {
              try {
                this.collapsedSections = new Set(JSON.parse(val));
              } catch (e) {
                console.error("Failed to parse collapsed sections", e);
              }
            }
          });
        } else {
          try {
            this.collapsedSections = new Set(JSON.parse(savedSections));
          } catch (e) {
            console.error("Failed to parse collapsed sections", e);
          }
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

  setDriver(driver: PersistenceDriver): void {
    this.#driver = driver;
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
