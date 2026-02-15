// src/lib/config.ts
// Unified facade over all app-level stores.
// Import this instead of wiring each store individually.

import { appStore } from "./features/config/stores/app.svelte";
import { apiStore } from "./features/config/stores/api.svelte";
import { toastStore } from "./features/config/stores/toast.svelte";
import { commandStore } from "./features/command-palette/commands.svelte";
import { themeStore } from "./features/config/stores/theme.svelte";
import { languageStore } from "./features/config/stores/language.svelte";
import { currencyStore } from "./features/config/stores/currency.svelte";

/**
 * `appConfig` — single entry-point to configure and control the entire app.
 *
 * @example
 * ```ts
 * import { appConfig } from 'rune-lab/config';
 *
 * appConfig.app.init({ name: 'My App', version: '1.0.0' });
 * appConfig.api.init('https://api.example.com', 'v1');
 * appConfig.toast.success('Ready!');
 * ```
 */
export const appConfig = {
  /** Application metadata (name, version, description…) */
  app: appStore,
  /** API connection state and base URL */
  api: apiStore,
  /** Active theme + available themes */
  theme: themeStore,
  /** Active language / locale */
  language: languageStore,
  /** Active currency */
  currency: currencyStore,
  /** Toast notification queue */
  toast: toastStore,
  /** Command palette registry */
  commands: commandStore,
} as const;

// Re-export individual stores for consumers who want fine-grained imports
export {
  apiStore,
  appStore,
  commandStore,
  currencyStore,
  languageStore,
  themeStore,
  toastStore,
};
