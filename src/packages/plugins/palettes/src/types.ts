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

export interface Command {
  id: string;
  label: string;
  category?: string;
  icon?: string;
  action?: () => void;
  children?: Command[];
}

export type ToastType = "info" | "success" | "warning" | "error";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}
