export { default as AppSettingSelector } from "./components/AppSettingSelector.svelte";
export { default as ConnectedNavigationPanel } from "./components/ConnectedNavigationPanel.svelte";
export { default as ConnectedWorkspaceStrip } from "./components/ConnectedWorkspaceStrip.svelte";
export { default as ContentArea } from "./components/ContentArea.svelte";
export { default as DetailPanel } from "./components/DetailPanel.svelte";
export { default as Icon } from "./components/Icon.svelte";
export { default as NavigationPanel } from "./components/NavigationPanel.svelte";
export { default as ResourceSelector } from "./components/ResourceSelector.svelte";
export { default as StatusbarOverflow } from "./components/StatusbarOverflow.svelte";
export { default as RichText } from "./components/text/RichText.svelte";
export { default as Text } from "./components/text/Text.svelte";
export { default as WorkspaceLayout } from "./components/WorkspaceLayout.svelte";
export { default as WorkspaceStrip } from "./components/WorkspaceStrip.svelte";
export { getLayoutStore, getTextStore, LayoutPlugin } from "./plugin.ts";

export { PRESETS } from "./presets.ts";
export * from "./types.ts";

export const LAYOUT_CONTEXT = {
  layout: Symbol.for("rl:layout"),
} as const;
