/**
 * Layout configuration
 */
export interface LayoutZone {
  id: string;
  component?: unknown;
  storeKey?: string;
  width?: string;
  collapsible?: boolean;
  conditional?: string;
  minWidth?: string;
  position?: "start" | "end";
}

export type LayoutConfig = LayoutZone[];

/**
 * Currency
 */
export interface Currency {
  code: string;
  symbol: string;
  decimals: number;
}

/**
 * Navigation & Workspace items
 */
export interface WorkspaceItem {
  id: string;
  icon: string;
  label: string;
  badge?: string | number;
  href?: string;
  onClick?: () => void;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  badge?: string | number;
  isActive?: boolean;
  onClick?: () => void;
  children?: NavigationItem[];
}

export interface NavigationSection {
  id: string;
  title: string;
  items: NavigationItem[];
}

/**
 * i18n
 */
export interface Language {
  code: string;
  flag?: string;
}

/**
 * Theme
 */
export interface Theme {
  name: string;
  icon?: string;
}

/**
 * Shortcuts
 */
export interface ShortcutConfig {
  id: string;
  keys: string;
  handler: (event: KeyboardEvent) => void;
  when?: () => boolean;
  label?: string;
  category?: string;
  scope?: "global" | "layout" | `panel:${string}`;
}

export interface ShortcutEntry extends ShortcutConfig {
  enabled?: boolean;
}

/**
 * Commands
 */
export interface Command {
  id: string;
  label: string;
  category?: string;
  icon?: string;
  action?: () => void;
  children?: Command[];
}

/**
 * Toasts
 */
export type ToastType = "info" | "success" | "warning" | "error";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}
