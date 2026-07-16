export { PalettesPlugin, palettesPluginSpec } from "./plugin.ts";

export {
  getCommandStore,
  getRegistryStore,
  getShortcutStore,
  getToastStore,
} from "./context.ts";

export { default as SettingsModal } from "./SettingsModal.svelte";
export { default as PaletteHost } from "./host/PaletteHost.svelte";

export * from "./commands/mod.ts";
export * from "./notifications/mod.ts";
export * from "./shortcuts/mod.ts";
export * from "./registry/registry.svelte.ts";
export * from "./types.ts";
export * from "./host/hotkeys.ts";
export * from "./context.ts";
