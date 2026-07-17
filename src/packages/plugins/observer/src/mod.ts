import type { ForgedPlugin } from "@rune-lab/core";
import { definePlugin } from "@rune-lab/core";
import CapabilitiesSettings from "./CapabilitiesSettings.svelte";
import ObserverPanel from "./ObserverPanel.svelte";

/**
 * Observer Plugin — provides docked developer tools, same-origin iframe preview,
 * and a microkernel capabilities page in settings.
 */
export const ObserverPlugin: ForgedPlugin<
  "rune-lab.observer",
  Record<never, never>
> = definePlugin({
  id: "rune-lab.observer",
  contributions: {
    settingsSections: [
      {
        id: "capabilities",
        label: "Capabilities",
        icon: "🔬",
        component: CapabilitiesSettings,
      },
    ],
  },
  overlays: [ObserverPanel],
});

export { CapabilitiesSettings, ObserverPanel };
