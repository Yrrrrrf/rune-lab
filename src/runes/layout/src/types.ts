// sdk/core/src/layout/types.ts
// Framework-agnostic layout configuration types.
// No Svelte dependency — `component` is typed as `unknown` (resolved by sdk/ui).

// ── Zone Configuration ─────────────────────────────────────────────────────────

/**
 * Describes a single zone within a workspace layout.
 * Zones are rendered in array order by the LayoutEngine in sdk/ui.
 */
export interface LayoutZone {
  /** Unique identifier for this zone (e.g., "navigation", "content", "detail"). */
  id: string;

  /**
   * Component reference to render in this zone.
   * Typed as `unknown` at the core level — the UI layer resolves this
   * to a concrete Svelte component reference.
   */
  component?: unknown;

  /**
   * Store binding key. When set, the LayoutEngine will pass the corresponding
   * store from the registry as a prop to the component.
   */
  storeKey?: string;

  /**
   * CSS width value for this zone (e.g., "280px", "1fr", "auto").
   * @default "auto"
   */
  width?: string;

  /**
   * Whether the zone can be collapsed by the user.
   * @default false
   */
  collapsible?: boolean;

  /**
   * Store boolean path that controls whether this zone is visible.
   * When set, the zone is only rendered when the referenced boolean is `true`.
   * @example "layout.showNavigation"
   */
  conditional?: string;

  /**
   * Minimum width before the zone collapses automatically.
   * Only relevant when `collapsible` is `true`.
   */
  minWidth?: string;

  /**
   * Position of the zone relative to the content area.
   * @default "start"
   */
  position?: "start" | "end";
}

// ── Layout Configuration ───────────────────────────────────────────────────────

/**
 * Complete layout configuration — an ordered array of zones.
 * The LayoutEngine renders zones in array order (left-to-right by default).
 *
 * @example
 * ```ts
 * const dashboardLayout: LayoutConfig = [
 *   { id: "navigation", width: "280px", collapsible: true },
 *   { id: "content", width: "1fr" },
 *   { id: "detail", width: "320px", collapsible: true, conditional: "layout.showDetail" },
 * ];
 * ```
 */
export type LayoutConfig = LayoutZone[];
