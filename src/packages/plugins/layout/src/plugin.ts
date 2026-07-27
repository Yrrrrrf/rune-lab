import { createPluginKit } from "rune-lab/ui";
import type { ConfigStore, ForgedPlugin, SlotSpec } from "rune-lab/core";
import { definePlugin, defineSlot } from "rune-lab/core";
import { layoutSettings } from "./settings.ts";
import { createLayoutStore, type LayoutStore } from "./stores/layout.svelte.ts";
import { createTextStore, type TextStoreFacade } from "./stores/text.svelte.ts";
import { createThemeStore, type Theme } from "./stores/theme.svelte.ts";

const layoutPluginSpec = definePlugin({
  id: "rune-lab.layout",
  slots: {
    layout: defineSlot({
      create: (ctx) => createLayoutStore(ctx),
      expose: true,
    }),
    text: defineSlot({
      create: (ctx) => createTextStore(ctx),
      dependsOn: ["theme"],
      expose: true,
    }),
    theme: defineSlot({
      create: (ctx) => createThemeStore(ctx),
      persist: true,
      expose: true,
    }),
  },
  settings: layoutSettings,
});

const kit = createPluginKit(layoutPluginSpec);

type LayoutSlots = {
  layout: SlotSpec<unknown, LayoutStore>;
  text: SlotSpec<unknown, TextStoreFacade>;
  theme: SlotSpec<unknown, ConfigStore<Theme, "name">>;
};

export const layout: ForgedPlugin<"rune-lab.layout", LayoutSlots> = kit.plugin;

export const getLayoutStore: () => LayoutStore = kit.accessors.getLayoutStore;
export const getTextStore: () => TextStoreFacade = kit.accessors.getTextStore;
export const getThemeStore: () => ConfigStore<Theme, "name"> =
  kit.accessors.getThemeStore;
