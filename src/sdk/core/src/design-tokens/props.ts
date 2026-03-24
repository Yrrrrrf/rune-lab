// sdk/core/src/design-tokens/props.ts
// Canonical shared prop interfaces for design tokens.
// No CSS-framework-specific logic here — class maps live in sdk/ui.

// ── Size Tokens ────────────────────────────────────────────────────────────────

/** Standard size scale used across all components. */
export type SizeToken = "xs" | "sm" | "md" | "lg" | "xl";

/** Mixin interface for components that accept a size prop. */
export interface WithSizing {
  /** Visual size variant. Defaults to "md" if omitted. */
  size?: SizeToken;
}

// ── Variant Tokens ─────────────────────────────────────────────────────────────

/**
 * Semantic variant tokens aligned with DaisyUI's theme system.
 * Kept as a union type for TypeScript inference; consumers can extend via
 * `string & {}` if they need custom variants.
 */
export type VariantToken =
  | "primary"
  | "secondary"
  | "accent"
  | "neutral"
  | "ghost"
  | "info"
  | "success"
  | "warning"
  | "error";

/** Mixin interface for components that accept a variant prop. */
export interface WithVariant {
  /** Semantic color variant. */
  variant?: VariantToken;
}

// ── Class Passthrough ──────────────────────────────────────────────────────────

/** Mixin interface for components that accept a custom CSS class. */
export interface WithClass {
  /** Additional CSS class string to merge with component classes. */
  class?: string;
}

// ── Combined ───────────────────────────────────────────────────────────────────

/**
 * Convenience intersection of all design-token mixins.
 * Use when a component supports size, variant, and custom class.
 */
export type WithDesignTokens = WithSizing & WithVariant & WithClass;

// ── Resolution Utilities ───────────────────────────────────────────────────────

/**
 * Maps a size token to a CSS class string using a component-specific map.
 * Returns the mapped class or an empty string for unknown tokens.
 *
 * @param size - The size token to resolve
 * @param classMap - Component-specific mapping of tokens to CSS classes
 * @param fallback - Fallback size if `size` is undefined (default: "md")
 *
 * @example
 * ```ts
 * const btnSizeMap = { xs: "btn-xs", sm: "btn-sm", md: "btn-md", lg: "btn-lg", xl: "btn-xl" };
 * resolveSize("lg", btnSizeMap); // "btn-lg"
 * resolveSize(undefined, btnSizeMap); // "btn-md"
 * ```
 */
export function resolveSize(
  size: SizeToken | undefined,
  classMap: Partial<Record<SizeToken, string>>,
  fallback: SizeToken = "md",
): string {
  const token = size ?? fallback;
  return classMap[token] ?? "";
}

/**
 * Maps a variant token to a CSS class string using a component-specific map.
 *
 * @param variant - The variant token to resolve
 * @param classMap - Component-specific mapping of tokens to CSS classes
 */
export function resolveVariant(
  variant: VariantToken | undefined,
  classMap: Partial<Record<VariantToken, string>>,
): string {
  if (!variant) return "";
  return classMap[variant] ?? "";
}
