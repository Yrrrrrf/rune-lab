// @internal/ui - Public barrel export
// All components, actions, and layout primitives

// ── Actions ───────────────────────────────────────────────────────────────────
export { portal } from "./actions/portal.js";

// ── Core Components ───────────────────────────────────────────────────────────
export { default as RuneProvider } from "./components/RuneProvider.svelte";
export { default as Icon } from "./components/Icon.svelte";
export { default as Toaster } from "./components/Toaster.svelte";
export { default as ApiMonitor } from "./components/ApiMonitor.svelte";

// ── Features ──────────────────────────────────────────────────────────────────
export { default as CommandPalette } from "./features/command-palette/CommandPalette.svelte";
export { default as ShortcutPalette } from "./features/shortcuts/ShortcutPalette.svelte";

// Setting Selectors
export { default as AppSettingSelector } from "./features/config/AppSettingSelector.svelte";
export { default as ThemeSelector } from "./features/config/ThemeSelector.svelte";
export { default as LanguageSelector } from "./features/config/LanguageSelector.svelte";
export { default as CurrencySelector } from "./features/config/CurrencySelector.svelte";

// ── Layout Primitives ─────────────────────────────────────────────────────────
export { default as WorkspaceLayout } from "./layout/WorkspaceLayout.svelte";
export { default as WorkspaceStrip } from "./layout/WorkspaceStrip.svelte";
export { default as NavigationPanel } from "./layout/NavigationPanel.svelte";
export { default as ContentArea } from "./layout/ContentArea.svelte";
export { default as DetailPanel } from "./layout/DetailPanel.svelte";

// ── Connected (Smart) Components ──────────────────────────────────────────────
export { default as ConnectedNavigationPanel } from "./layout/ConnectedNavigationPanel.svelte";
export { default as ConnectedWorkspaceStrip } from "./layout/ConnectedWorkspaceStrip.svelte";

// ── Paraglide messages ────────────────────────────────────────────────────────
export * as sdkMessages from "./paraglide/messages.js";

// Consumers shouldn't need rune-lab/state just to get cookieDriver, stores, etc.
export * from "@internal/state";
export * from "@internal/core";
