import type { PersistenceDriver, SlotContext } from "@rune-lab/core";
import { PRESETS } from "../presets.ts";
import type { PresetState, WorkspaceItem } from "../types.ts";

export class LayoutStore {
  workspaces: WorkspaceItem[] = $state<WorkspaceItem[]>([]);
  activeWorkspaceId: string | null = $state<string | null>(null);
  activeNavItemId: string | null = $state<string | null>(null);
  collapsedSections: Set<string> = $state<Set<string>>(new Set());

  // Zone & Preset state
  preset: string = $state<string>("workspace");
  zones: Record<string, { visible: boolean; size?: number }> = $state<
    Record<string, { visible: boolean; size?: number }>
  >({
    nav: { visible: true, size: 280 },
    strip: { visible: true, size: 64 },
    content: { visible: true },
    detail: { visible: true, size: 300 },
    statusbar: { visible: true, size: 24 },
    "overlay-anchor": { visible: true },
  });

  #storageNamespace = "default";
  #initialized = false;
  #driver: PersistenceDriver | undefined;

  constructor(ctx?: SlotContext<unknown>) {
    this.#driver = ctx?.persistence;
  }

  // Getters for legacy compatibility
  get navOpen(): boolean {
    return this.zones.nav.visible;
  }
  set navOpen(v: boolean) {
    this.zones.nav.visible = v;
  }

  get detailOpen(): boolean {
    return this.zones.detail.visible;
  }
  set detailOpen(v: boolean) {
    this.zones.detail.visible = v;
  }

  init(options?: { namespace?: string; driver?: PersistenceDriver }) {
    if (this.#initialized) return;
    if (options?.namespace) this.#storageNamespace = options.namespace;
    if (options?.driver) this.#driver = options.driver;

    this.#ensureDriver();
    this.#loadPersistedState();
    this.#setupPersistenceEffects();

    this.#initialized = true;
  }

  #ensureDriver() {
    if (!this.#driver && typeof window !== "undefined") {
      this.#driver = {
        get: (key: string) => localStorage.getItem(key),
        set: (key: string, val: string) => localStorage.setItem(key, val),
        remove: (key: string) => localStorage.removeItem(key),
      };
    }
  }

  #loadPersistedState() {
    if (!this.#driver) return;

    this.#loadWorkspace();
    this.#loadSections();
    this.#loadPreset();
  }

  #loadWorkspace() {
    const driver = this.#driver;
    if (!driver) return;
    const saved = driver.get(
      `rl:layout:${this.#storageNamespace}:workspace`,
    );
    if (saved instanceof Promise) {
      saved.then((val) => {
        if (val) this.activeWorkspaceId = val;
      });
    } else if (saved) {
      this.activeWorkspaceId = saved;
    }
  }

  #loadSections() {
    const driver = this.#driver;
    if (!driver) return;
    const saved = driver.get(
      `rl:layout:${this.#storageNamespace}:sections`,
    );
    const applySections = (val: string | null) => {
      if (val) {
        try {
          this.collapsedSections = new Set(JSON.parse(val));
        } catch (e) {
          console.error("Failed to parse collapsed sections", e);
        }
      }
    };
    if (saved instanceof Promise) {
      saved.then(applySections);
    } else {
      applySections(saved);
    }
  }

  #loadPreset() {
    const driver = this.#driver;
    if (!driver) return;
    const saved = driver.get(
      `rl:layout:${this.#storageNamespace}:preset`,
    );
    const applyPresetVal = (val: string | null) => {
      if (val && PRESETS[val]) {
        this.applyPreset(val);
      }
    };
    if (saved instanceof Promise) {
      saved.then(applyPresetVal);
    } else if (saved) {
      applyPresetVal(saved);
    }
  }

  #setupPersistenceEffects() {
    if (!this.#driver) return;

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

      $effect(() => {
        this.#driver?.set(
          `rl:layout:${this.#storageNamespace}:preset`,
          this.preset,
        );
      });
    });
  }

  applyPreset(presetId: string | PresetState) {
    if (typeof presetId === "string") {
      const state = PRESETS[presetId];
      if (state) {
        this.preset = presetId;
        for (const [zone, val] of Object.entries(state)) {
          this.zones[zone] = { ...val };
        }
      }
    } else {
      this.preset = "custom";
      for (const [zone, val] of Object.entries(presetId)) {
        this.zones[zone] = { ...val };
      }
    }
  }

  toggleZone(zoneId: string) {
    if (this.zones[zoneId]) {
      this.zones[zoneId].visible = !this.zones[zoneId].visible;
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
    this.toggleZone("nav");
  }

  toggleDetail() {
    this.toggleZone("detail");
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

export function createLayoutStore(ctx?: SlotContext<unknown>): LayoutStore {
  return new LayoutStore(ctx);
}
