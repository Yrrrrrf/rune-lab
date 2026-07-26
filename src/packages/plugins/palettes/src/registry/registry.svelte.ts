import type { Component } from "svelte";

export interface RouterAdapter {
  replaceState?: (url: string) => void;
  pushState?: (url: string) => void;
}

/**
 * An extra hotkey that opens a palette at a specific section (C24).
 *
 * This is what lets `cmd+/` land on the shortcuts section of the settings
 * modal now that the standalone shortcuts palette is gone: the destination is
 * a section of an existing palette, not a palette of its own.
 */
export interface PaletteSectionHotkey {
  hotkey: string;
  section: string;
  /** Used for the shortcut's own label, e.g. "Open Shortcuts". */
  title: string;
}

export interface PaletteDefinition {
  id: string;
  title: string;
  hotkey?: string;
  provider?: () => unknown;
  renderer?: Component;
  onSelect?: (item: unknown) => void;
  boxClass?: string;
  sectionHotkeys?: PaletteSectionHotkey[];
}

export class PaletteRegistryStore {
  palettes: PaletteDefinition[] = $state([]);
  activePaletteId: string | null = $state(null);
  activeSectionId: string = $state("general");
  router?: RouterAdapter;

  constructor(config?: { router?: RouterAdapter }) {
    this.router = config?.router;
  }

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

  open(id: string, section?: string) {
    this.activePaletteId = id;
    if (section) {
      this.activeSectionId = section;
    }
  }

  setSection(sectionId: string) {
    this.activeSectionId = sectionId;
  }

  close() {
    this.activePaletteId = null;
  }
}

export function createPaletteRegistryStore(config?: {
  router?: RouterAdapter;
}): PaletteRegistryStore {
  return new PaletteRegistryStore(config);
}
