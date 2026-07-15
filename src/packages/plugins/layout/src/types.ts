import type { Language } from "@rune-lab/i18n";
import type { Theme } from "@rune-lab/palettes";

export type { Language, Theme };

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

export const LAYOUT_SHORTCUTS = {
  TOGGLE_NAV: {
    id: "layout:toggle-nav",
    keys: "ctrl+b",
    label: "Toggle Sidebar",
    category: "Layout",
  },
  TOGGLE_DETAIL: {
    id: "layout:toggle-detail",
    keys: "ctrl+alt+b",
    label: "Toggle Detail Panel",
    category: "Layout",
  },
  OPEN_SHORTCUTS: {
    id: "layout:open-shortcuts",
    keys: "ctrl+/",
    label: "Show Shortcuts",
    category: "Layout",
  },
} as const;

export type LayoutPreset = "page" | "docs" | "workspace";

export interface ZoneState {
  visible: boolean;
  size?: number;
}

export interface PresetState {
  nav: ZoneState;
  strip: ZoneState;
  content: ZoneState;
  detail: ZoneState;
  statusbar: ZoneState;
  "overlay-anchor": ZoneState;
}
