export type SizeToken = "xs" | "sm" | "md" | "lg" | "xl";

export interface WithSizing {
  size?: SizeToken;
}

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

export interface WithVariant {
  variant?: VariantToken;
}

export interface WithClass {
  class?: string;
}

export type WithDesignTokens = WithSizing & WithVariant & WithClass;

export function resolveSize(
  size: SizeToken | undefined,
  classMap: Partial<Record<SizeToken, string>>,
  fallback: SizeToken = "md",
): string {
  const token = size ?? fallback;
  return classMap[token] ?? "";
}

export function resolveVariant(
  variant: VariantToken | undefined,
  classMap: Partial<Record<VariantToken, string>>,
): string {
  if (!variant) return "";
  return classMap[variant] ?? "";
}
