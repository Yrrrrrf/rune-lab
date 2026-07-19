import { getContextSymbol } from "@rune-lab/core";
import { createAccessor } from "@rune-lab/svelte";
import type { CommandStore } from "./commands/store.svelte.ts";
import type { ToastStore } from "./notifications/store.svelte.ts";
import type { PaletteRegistryStore } from "./registry/registry.svelte.ts";
import type { ShortcutStore } from "./shortcuts/store.svelte.ts";

const PLUGIN_ID = "rune-lab.palettes";

const accessor = <T>(slot: string, storeName: string): () => T =>
  createAccessor<T>(
    getContextSymbol(PLUGIN_ID, slot),
    `get${storeName}()`,
    storeName,
    PLUGIN_ID,
  );

export const getCommandStore: () => CommandStore = accessor(
  "commands",
  "CommandStore",
);
export const getShortcutStore: () => ShortcutStore = accessor(
  "shortcuts",
  "ShortcutStore",
);
export const getToastStore: () => ToastStore = accessor("toasts", "ToastStore");
export const getRegistryStore: () => PaletteRegistryStore = accessor(
  "registry",
  "RegistryStore",
);
