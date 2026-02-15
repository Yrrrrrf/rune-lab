export const COLORS = [
  "neutral",
  "primary",
  "secondary",
  "accent",
  "info",
  "success",
  "warning",
  "error",
] as const;
export const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
export const STYLES = ["default", "soft", "outline", "dash", "ghost"] as const;

// Per-component style arrays (not every component has all 5 styles)
export const BTN_STYLES = [
  "",
  "btn-soft",
  "btn-outline",
  "btn-dash",
  "btn-ghost",
] as const;
export const BADGE_STYLES = [
  "",
  "badge-soft",
  "badge-outline",
  "badge-dash",
  "badge-ghost",
] as const;
export const ALERT_STYLES = [
  "",
  "alert-soft",
  "alert-outline",
  "alert-dash",
] as const;
export const CARD_STYLES = ["", "card-border", "card-dash"] as const;
