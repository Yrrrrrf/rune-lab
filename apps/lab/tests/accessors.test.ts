import { describe, expect, it, vi } from "vite-plus/test";

const mockStores = new Map<any, any>();

// Mock Svelte's getContext so we can test the behavior of context accessors
vi.mock("svelte", () => ({
  getContext: (key: any) => mockStores.get(key),
}));

import { getCurrencyStore, getLanguageStore } from "@rune-lab/i18n";
import { getLayoutStore, getThemeStore } from "@rune-lab/layout";
import {
  getCommandStore,
  getRegistryStore,
  getShortcutStore,
  getToastStore,
  palettesPluginSpec,
} from "@rune-lab/palettes";
import { getAppStore } from "@rune-lab/svelte";

describe("Fail-fast context accessors", () => {
  it("should throw a helpful error for getAppStore", () => {
    expect(() => getAppStore()).toThrow(/getAppStore\(\) found no AppStore/i);
  });

  it("should throw a helpful error for getLayoutStore", () => {
    expect(() => getLayoutStore()).toThrow(
      /getLayoutStore\(\) found no LayoutStore.*rune-lab\.layout/i,
    );
  });

  it("should throw a helpful error for getLanguageStore", () => {
    expect(() => getLanguageStore()).toThrow(
      /getLanguageStore\(\) found no LanguageStore.*rune-lab\.i18n/i,
    );
  });

  it("should throw a helpful error for getThemeStore", () => {
    expect(() => getThemeStore()).toThrow(
      /getThemeStore\(\) found no ThemeStore.*rune-lab\.layout/i,
    );
  });

  it("should throw a helpful error for getShortcutStore", () => {
    expect(() => getShortcutStore()).toThrow(
      /getShortcutStore\(\) found no ShortcutStore.*PalettesPlugin/i,
    );
  });

  it("should throw a helpful error for getCommandStore", () => {
    expect(() => getCommandStore()).toThrow(
      /getCommandStore\(\) found no CommandStore.*PalettesPlugin/i,
    );
  });

  it("should throw a helpful error for getToastStore", () => {
    expect(() => getToastStore()).toThrow(
      /getToastStore\(\) found no ToastStore.*PalettesPlugin/i,
    );
  });

  it("should throw a helpful error for getCurrencyStore", () => {
    expect(() => getCurrencyStore()).toThrow(
      /getCurrencyStore\(\) found no CurrencyStore.*rune-lab\.i18n/i,
    );
  });
});

describe("Public registry contract smoke test", () => {
  it("should support registering a toy palette through the registry store", () => {
    const registryStore = palettesPluginSpec.slots.registry.create();
    const key = Symbol.for("rl:rune-lab.palettes:registry");
    mockStores.set(key, registryStore);

    expect(getRegistryStore()).toBe(registryStore);

    const toyPalette = {
      id: "toy-palette",
      title: "Toy Palette",
      hotkey: "ctrl+t",
      renderer: null,
    };

    registryStore.register(toyPalette);
    expect(registryStore.palettes.find((p: any) => p.id === "toy-palette"))
      .toBeDefined();

    registryStore.open("toy-palette");
    expect(registryStore.activePaletteId).toBe("toy-palette");

    registryStore.close();
    expect(registryStore.activePaletteId).toBeNull();

    registryStore.unregister("toy-palette");
    expect(registryStore.palettes.find((p: any) => p.id === "toy-palette"))
      .toBeUndefined();
  });
});
