// sdk/ui/src/lib/features/config/APP_CONFIGURATIONS.ts
// Single source of truth for all configuration dimensions.
// Frozen at import time — must not be mutated at runtime.

/**
 * Describes a single configuration dimension
 * (e.g., theme, language, currency) for the generic selector system.
 */
export interface ConfigDimension {
  /** Unique key matching the RUNE_LAB_CONTEXT key */
  readonly key: string;
  /** Key used to look up the ConfigStore from context */
  readonly storeKey: string;
  /** Property name used as the item identifier */
  readonly idKey: string;
  /** Emoji used for display / logging */
  readonly icon: string;
  /** Human-readable label for settings panels */
  readonly label: string;
}

/**
 * All built-in configuration dimensions.
 * Used by `AppSettingSelector` and settings panels to enumerate available
 * config pickers without hard-coding them.
 *
 * @example
 * ```svelte
 * {#each APP_CONFIGURATIONS as dim}
 *   <ResourceSelector store={stores[dim.storeKey]} idKey={dim.idKey} ... />
 * {/each}
 * ```
 */
export const APP_CONFIGURATIONS: readonly ConfigDimension[] = Object.freeze([
  {
    key: "theme",
    storeKey: "theme",
    idKey: "name",
    icon: "🎨",
    label: "Theme",
  },
  {
    key: "language",
    storeKey: "language",
    idKey: "code",
    icon: "🌍",
    label: "Language",
  },
  {
    key: "currency",
    storeKey: "currency",
    idKey: "code",
    icon: "💰",
    label: "Currency",
  },
]);
