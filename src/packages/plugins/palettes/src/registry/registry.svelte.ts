import type { Component } from "svelte";

export interface PaletteDefinition {
  id: string;
  title: string;
  hotkey?: string;
  provider?: () => unknown;
  renderer?: Component;
  onSelect?: (item: unknown) => void;
}

export class PaletteRegistryStore {
  palettes: PaletteDefinition[] = $state([]);
  activePaletteId: string | null = $state(null);

  register(palette: PaletteDefinition) {
    if (this.palettes.some((p) => p.id === palette.id)) return;
    this.palettes.push(palette);
  }

  unregister(id: string) {
    this.palettes = this.palettes.filter((p) => p.id !== id);
    if (this.activePaletteId === id) {
      this.activePaletteId = null;
    }
  }

  open(id: string) {
    this.activePaletteId = id;
  }

  close() {
    this.activePaletteId = null;
  }
}

export function createPaletteRegistryStore(): PaletteRegistryStore {
  return new PaletteRegistryStore();
}
