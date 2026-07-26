// Plugins shipped in the published rune-lab package (core + ui always ship).
// NOTE: plugins depend on each other (i18n & palettes use layout, observer
// uses palettes) - prune with care.
//   layout   - workspace layout + pretext text engine
//   palettes - commands / shortcuts / notifications / settings wiring
//   i18n     - languages + currencies engine
//   observer - meta-dev tool panel
//   explorer - (future) api explorer
export const PLUGINS = ["layout", "palettes", "i18n", "observer"] as const;

export type PluginName = (typeof PLUGINS)[number];

export const PLUGIN_DEPS: Record<PluginName, readonly PluginName[]> = {
  layout: [],
  palettes: ["layout"],
  i18n: ["layout"],
  observer: ["palettes"],
} as const;
