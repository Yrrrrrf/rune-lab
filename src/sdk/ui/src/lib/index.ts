// All components, actions, and layout primitives

// ── Actions ───────────────────────────────────────────────────────────────────
export { portal } from "./actions/portal.ts";

// ── Core Components ───────────────────────────────────────────────────────────
export { default as RuneProvider } from "./components/RuneProvider.svelte";
export { default as Icon } from "./components/Icon.svelte";
export { default as Toaster } from "./components/Toaster.svelte";
export { default as ApiMonitor } from "./components/ApiMonitor.svelte";
export { default as Kyntharil } from "./components/Kyntharil.svelte";

// ── Features ──────────────────────────────────────────────────────────────────
export { default as CommandPalette } from "./features/command-palette/CommandPalette.svelte";
export { default as ShortcutPalette } from "./features/shortcuts/ShortcutPalette.svelte";
export { default as ShortcutBinder } from "./features/shortcuts/ShortcutBinder.svelte";

// Setting Selectors
export { default as AppSettingSelector } from "./features/config/AppSettingSelector.svelte";
export { default as ResourceSelector } from "./features/config/ResourceSelector.svelte";
export {
  APP_CONFIGURATIONS,
  type ConfigDimension,
} from "./features/config/APP_CONFIGURATIONS.ts";
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

// ── Connection Factory (Phase 3) ──────────────────────────────────────────────
export {
  createNavigationConnection,
  createWorkspaceConnection,
  type NavigationConnection,
  type WorkspaceConnection,
} from "./layout/connection-factory.ts";

// ── Primitives ────────────────────────────────────────────────────────────────
export { default as DatePicker } from "./primitives/DatePicker.svelte";

// ── User Components ───────────────────────────────────────────────────────────
export { default as UserAvatar } from "./components/user/UserAvatar.svelte";
export { default as UserProfile } from "./components/user/UserProfile.svelte";

// ── Notification Components ───────────────────────────────────────────────────
export { default as NotificationBell } from "./features/notifications/NotificationBell.svelte";

// ── Money Components ──────────────────────────────────────────────────────────
export { default as MoneyDisplay } from "./components/money/MoneyDisplay.svelte";
export { default as MoneyInput } from "./components/money/MoneyInput.svelte";

// ── Paraglide messages ────────────────────────────────────────────────────────
export * as sdkMessages from "./paraglide/messages.js";

// // Consumers shouldn't need rune-lab/state just to get cookieDriver, stores, etc.
// export * from "@internal/state";
// export * from "@internal/core";
