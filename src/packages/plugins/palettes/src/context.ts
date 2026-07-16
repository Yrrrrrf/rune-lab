import { createAccessor } from "@rune-lab/svelte";
import type { CommandStore } from "./commands/store.svelte.ts";
import type { ShortcutStore } from "./shortcuts/store.svelte.ts";
import type { ToastStore } from "./notifications/store.svelte.ts";
import type { PaletteRegistryStore } from "./registry/registry.svelte.ts";

export const getCommandStore = createAccessor<CommandStore>(
  Symbol.for("rl:rune-lab.palettes:commands"),
  "getCommandStore()",
  "CommandStore",
  "PalettesPlugin",
);

export const getShortcutStore = createAccessor<ShortcutStore>(
  Symbol.for("rl:rune-lab.palettes:shortcuts"),
  "getShortcutStore()",
  "ShortcutStore",
  "PalettesPlugin",
);

export const getToastStore = createAccessor<ToastStore>(
  Symbol.for("rl:rune-lab.palettes:toasts"),
  "getToastStore()",
  "ToastStore",
  "PalettesPlugin",
);

export const getRegistryStore = createAccessor<PaletteRegistryStore>(
  Symbol.for("rl:rune-lab.palettes:registry"),
  "getRegistryStore()",
  "PaletteRegistryStore",
  "PalettesPlugin",
);
