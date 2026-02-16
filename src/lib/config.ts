// src/lib/config.ts
// Unified facade over all app-level stores.
// Import this instead of wiring each store individually.

import {
  apiStore,
  appStore,
  commandStore,
  currencyStore,
  languageStore,
  themeStore,
  toastStore,
} from "./state/index";

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
