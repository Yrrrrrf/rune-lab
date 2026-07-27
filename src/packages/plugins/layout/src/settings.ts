import type { SettingsSchema } from "rune-lab/core";
import { defineSettings, toOptions } from "rune-lab/core";
import { themePresenter } from "./theme-presenter.ts";

export const layoutSettings: SettingsSchema = defineSettings({
  id: "general",
  label: "General Settings",
  icon: "settings",
  fields: [
    {
      id: "rune-lab.layout.preset",
      label: "Layout Preset",
      type: "select",
      target: {
        type: "store",
        storeId: "layout",
        property: "preset",
      },
      options: () => [
        { value: "page", label: "Simple Page" },
        { value: "docs", label: "Documentation" },
        { value: "workspace", label: "Workspace IDE" },
      ],
    },
    {
      id: "rune-lab.layout.theme",
      label: "Theme",
      type: "select",
      target: {
        type: "store",
        storeId: "theme",
        property: "current",
      },
      options: () => toOptions(themePresenter),
    },
  ],
});
