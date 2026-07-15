import type { SettingsSchema } from "@rune-lab/core";
import { defineSettings } from "@rune-lab/core";

export const layoutSettings: SettingsSchema = defineSettings({
  id: "general",
  label: "General Settings",
  icon: "settings",
  fields: [
    {
      id: "preset",
      label: "Layout Preset",
      type: "select",
      target: {
        type: "store",
        storeId: "layout",
        property: "preset",
      },
      options: [
        { value: "page", label: "Simple Page" },
        { value: "docs", label: "Documentation" },
        { value: "workspace", label: "Workspace IDE" },
      ],
    },
  ],
});
