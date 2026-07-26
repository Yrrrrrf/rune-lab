// Plugins shipped in the published rune-lab package (core + ui always ship).
// NOTE: plugins depend on each other (observer uses palettes) - prune with
// care. C24.3 hoisted the shared selector shell (Icon, ResourceSelector,
// AppSettingSelector) into `ui`, so palettes and i18n no longer need layout
// just to reach it.
//   layout   - workspace layout + pretext text engine
//   palettes - commands / shortcuts / notifications / settings wiring
//   i18n     - languages + currencies engine
//   observer - meta-dev tool panel
//   explorer - (future) api explorer
export const PLUGINS = ["layout", "palettes", "i18n", "observer"] as const;

export type PluginName = (typeof PLUGINS)[number];

export const PLUGIN_DEPS: Record<PluginName, readonly PluginName[]> = {
  layout: [],
  palettes: [],
  i18n: [],
  observer: ["palettes"],
} as const;
