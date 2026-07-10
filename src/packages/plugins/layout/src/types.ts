// sdk/core/src/layout/types.ts
// Framework-agnostic layout configuration types.
// No Svelte dependency — `component` is typed as `unknown` (resolved by sdk/ui).

export type { LayoutConfig, LayoutZone } from "@rune-lab/svelte";

/**
 * Standard layout shortcuts
 * Re-exported from kernel
 */
export { LAYOUT_SHORTCUTS } from "@rune-lab/svelte";
