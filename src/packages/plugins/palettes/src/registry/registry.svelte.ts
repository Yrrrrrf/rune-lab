export interface PaletteDefinition {
  id: string;
  title: string;
  hotkey?: string;
  provider?: () => unknown;
  renderer?: any;
  onSelect?: (item: any) => void;
}

export class PaletteRegistryStore {
  palettes = $state<PaletteDefinition[]>([]);
  activePaletteId = $state<string | null>(null);

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
