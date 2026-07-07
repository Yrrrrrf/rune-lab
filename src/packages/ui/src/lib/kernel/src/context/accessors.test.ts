import { describe, expect, it, vi } from "vite-plus/test";

// Mock Svelte's getContext so we can test the behavior when a context is not present
// without triggering Svelte's lifecycle_outside_component error.
vi.mock("svelte", () => ({
  getContext: () => undefined,
}));

import {
  getCommandStore,
  getCurrencyStore,
  getLanguageStore,
  getLayoutStore,
  getShortcutStore,
  getThemeStore,
  getToastStore,
} from "./stores.svelte.ts";
import { getAppStore } from "./app.svelte.ts";

describe("Fail-fast context accessors", () => {
  it("should throw a helpful error for getAppStore", () => {
    expect(() => getAppStore()).toThrow(
      /getAppStore\(\) found no AppStore/i,
    );
  });

  it("should throw a helpful error for getLayoutStore", () => {
    expect(() => getLayoutStore()).toThrow(
      /getLayoutStore\(\) found no LayoutStore.*LayoutPlugin/i,
    );
  });

  it("should throw a helpful error for getLanguageStore", () => {
    expect(() => getLanguageStore()).toThrow(
      /getLanguageStore\(\) found no LanguageStore.*LayoutPlugin/i,
    );
  });

  it("should throw a helpful error for getThemeStore", () => {
    expect(() => getThemeStore()).toThrow(
      /getThemeStore\(\) found no ThemeStore.*LayoutPlugin/i,
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
      /getCurrencyStore\(\) found no CurrencyStore.*MoneyPlugin/i,
    );
  });
});
