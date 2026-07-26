import { Schema } from "effect";
import { createPluginKit } from "rune-lab";
import type { ConfigStore, ForgedPlugin, SlotSpec } from "rune-lab/core";
import { contribute, definePlugin, defineSlot, messages } from "rune-lab/core";
import { layoutSettings } from "./settings.ts";
import { createLayoutStore, type LayoutStore } from "./stores/layout.svelte.ts";
import { createTextStore, type TextStoreFacade } from "./stores/text.svelte.ts";
import { createThemeStore, type Theme } from "./stores/theme.svelte.ts";

type ThemeName = string;

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
      config: Schema.Union(Schema.Literal("light", "dark"), Schema.String),
      persist: true,
    }),
  },
  settings: layoutSettings,
  contributions: [
    contribute(messages, {
      "layout.modal.select_option": "Select Option",
      "layout.modal.close": "close",
      "layout.nav.close_navigation": "Close navigation",
      "layout.nav.close_detail_panel": "Close detail panel",
    }),
  ],
});

const kit = createPluginKit(layoutPluginSpec);

type LayoutSlots = {
  layout: SlotSpec<unknown, LayoutStore>;
  text: SlotSpec<unknown, TextStoreFacade>;
  theme: SlotSpec<ThemeName, ConfigStore<Theme, "name">, ThemeName>;
};

export const layout: ForgedPlugin<"rune-lab.layout", LayoutSlots> = kit.plugin;

export const getLayoutStore: () => LayoutStore = kit.accessors.getLayoutStore;
export const getTextStore: () => TextStoreFacade = kit.accessors.getTextStore;
export const getThemeStore: () => ConfigStore<Theme, "name"> =
  kit.accessors.getThemeStore;
