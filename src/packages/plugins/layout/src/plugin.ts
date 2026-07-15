import { definePlugin } from "@rune-lab/core";
import { createPluginKit } from "@rune-lab/svelte";
import { layoutSettings } from "./settings.ts";
import { createLayoutStore } from "./stores/layout.svelte.ts";
import { createTextStore } from "./stores/text.svelte.ts";

export const layoutPluginSpec = definePlugin({
  id: "rune-lab.layout",
  slots: {
    layout: {
      create: (ctx) => createLayoutStore(ctx),
      contextKey: Symbol.for("rl:layout"),
      expose: true,
    },
    text: {
      create: (ctx) => createTextStore(ctx),
      dependsOn: ["theme", "language"],
      expose: true,
    },
  },
  settings: layoutSettings,
});

const kit = createPluginKit(layoutPluginSpec);

export const LayoutPlugin = kit.plugin;
export const { getLayoutStore, getTextStore } = kit.accessors;
