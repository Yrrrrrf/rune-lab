import { defineRune, RUNE_LAB_CONTEXT } from "@rune-lab/kernel";
import type { RunePlugin } from "@rune-lab/kernel";
import { createAppStore } from "./app.svelte.ts";
import Kythrill from "./Kythrill.svelte";
import { DEV } from "esm-env";
import type { Component } from "svelte";

/**
 * Kythrill Plugin — the developer's companion.
 * Provides application metadata and the Kythrill dev overlay.
 * Only active in DEV mode.
 */
export const KythrillPlugin: RunePlugin = defineRune({
  id: "rune-lab.kythrill",
  stores: [
    {
      id: "app",
      contextKey: RUNE_LAB_CONTEXT.app,
      factory: () => DEV ? createAppStore() : null,
      noPersistence: true,
      optional: true,
      dependsOn: ["layout", "shortcut", "commands", "toast"],
    },
  ],
  overlays: DEV ? [Kythrill as Component<Record<never, never>>] : [],
});
