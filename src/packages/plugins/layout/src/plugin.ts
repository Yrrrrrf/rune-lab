import type {
  ConfigStore,
  ForgedPlugin,
  SlotContext,
  SlotSpec,
} from "@rune-lab/core";
import { definePlugin } from "@rune-lab/core";
import { createPluginKit } from "@rune-lab/svelte";
import { Schema } from "effect";
import { layoutSettings } from "./settings.ts";
import { createLayoutStore, type LayoutStore } from "./stores/layout.svelte.ts";
import { createTextStore, type TextStoreFacade } from "./stores/text.svelte.ts";
import { createThemeStore, type Theme } from "./stores/theme.svelte.ts";

export const layoutPluginSpec = definePlugin({
  id: "rune-lab.layout",
  slots: {
    layout: {
      create: (ctx: SlotContext<unknown>) => createLayoutStore(ctx),
      expose: true,
    },
    text: {
      create: (ctx: SlotContext<unknown>) => createTextStore(ctx),
      dependsOn: ["theme"],
      expose: true,
    },
    theme: {
      create: (ctx: SlotContext<unknown>) => createThemeStore(ctx),
      config: Schema.Union(Schema.Literal("light", "dark"), Schema.String),
      persist: true,
    },
  },
  settings: layoutSettings,
});

const kit = createPluginKit(layoutPluginSpec);

export const LayoutPlugin = kit.plugin;

export const getLayoutStore: () => LayoutStore = kit.accessors.getLayoutStore;
export const getTextStore: () => TextStoreFacade = kit.accessors.getTextStore;
export const getThemeStore: () => ConfigStore<Theme, "name"> =
  kit.accessors.getThemeStore;
