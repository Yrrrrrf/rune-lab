import type { ForgedPlugin, SlotContext, SlotSpec } from "@rune-lab/core";
import { definePlugin } from "@rune-lab/core";
import { createPluginKit } from "@rune-lab/svelte";
import { layoutSettings } from "./settings.ts";
import { createLayoutStore, type LayoutStore } from "./stores/layout.svelte.ts";
import { createTextStore, type TextStoreFacade } from "./stores/text.svelte.ts";

export const layoutPluginSpec: ForgedPlugin<
  "rune-lab.layout",
  {
    layout: SlotSpec<unknown, LayoutStore>;
    text: SlotSpec<unknown, TextStoreFacade>;
  }
> = definePlugin({
  id: "rune-lab.layout",
  slots: {
    layout: {
      create: (ctx: SlotContext<unknown>) => createLayoutStore(ctx),
      contextKey: Symbol.for("rl:layout"),
      expose: true,
    },
    text: {
      create: (ctx: SlotContext<unknown>) => createTextStore(ctx),
      dependsOn: ["theme", "language"],
      expose: true,
    },
  },
  settings: layoutSettings,
});

const kit = createPluginKit(layoutPluginSpec);

export const LayoutPlugin: ForgedPlugin<
  "rune-lab.layout",
  {
    layout: SlotSpec<unknown, LayoutStore>;
    text: SlotSpec<unknown, TextStoreFacade>;
  }
> = kit.plugin;

export const getLayoutStore: () => LayoutStore = kit.accessors.getLayoutStore;
export const getTextStore: () => TextStoreFacade = kit.accessors.getTextStore;
