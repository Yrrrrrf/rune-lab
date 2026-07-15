import { definePlugin, defineSettings } from "@rune-lab/core";
import { createPluginKit } from "@rune-lab/svelte";
import { createThemeStore } from "./store.svelte.ts";

export const themePluginSpec = definePlugin({
  id: "rune-lab.theme",
  slots: {
    theme: {
      create: (ctx: any) => createThemeStore(ctx),
      contextKey: Symbol.for("rl:theme"),
      persist: true,
    },
  },
  settings: defineSettings({
    id: "theme",
    label: "Theme Settings",
    icon: "palette",
    fields: [
      {
        id: "theme",
        label: "Theme",
        type: "select",
        target: {
          type: "store",
          storeId: "theme",
          property: "current",
        },
        options: [
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "nord", label: "Nord" },
        ],
      },
    ],
  }),
});

const kit = createPluginKit(themePluginSpec);
export const ThemePlugin = kit.plugin;
export const { getThemeStore } = kit.accessors;
export { default as ThemeSelector } from "../ThemeSelector.svelte";
export type { Theme } from "./store.svelte.ts";
