import type { SlotContext } from "rune-lab/core";
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

  constructor(_ctx?: SlotContext<unknown>) {}

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
