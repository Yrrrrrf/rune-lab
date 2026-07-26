export { THEME_BOOT_SCRIPT } from "./boot-snippet.ts";
export { default as ConnectedNavigationPanel } from "./components/ConnectedNavigationPanel.svelte";
export { default as ConnectedWorkspaceStrip } from "./components/ConnectedWorkspaceStrip.svelte";
export { default as ContentArea } from "./components/ContentArea.svelte";
export { default as DetailPanel } from "./components/DetailPanel.svelte";
export { default as NavigationPanel } from "./components/NavigationPanel.svelte";
export { default as StatusbarOverflow } from "./components/StatusbarOverflow.svelte";
export { default as ThemeSelector } from "./components/ThemeSelector.svelte";
export { default as ThemeSwatch } from "./components/ThemeSwatch.svelte";
export { default as RichText } from "./components/text/RichText.svelte";
export { default as Text } from "./components/text/Text.svelte";
export { default as WorkspaceLayout } from "./components/WorkspaceLayout.svelte";
export { default as WorkspaceStrip } from "./components/WorkspaceStrip.svelte";
export { statusbar } from "./contributions.ts";
export {
  getLayoutStore,
  getTextStore,
  getThemeStore,
  layout,
} from "./plugin.ts";
export { PRESETS } from "./presets.ts";
export { type Theme, type ThemeConfig, THEMES } from "./stores/theme.svelte.ts";
export { themePresenter } from "./theme-presenter.ts";
export * from "./types.ts";
