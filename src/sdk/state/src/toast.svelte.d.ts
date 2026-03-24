/**
 * Toast notification store
 */
export type ToastType = "info" | "success" | "warning" | "error";
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}
export declare class ToastStore {
  toasts: Toast[];
  /**
   * Add a new toast
   */
  send(message: string, type?: ToastType, duration?: number): void;
  /**
   * Remove a toast by id
   */
  dismiss(id: string): void;
  success(msg: string): void;
  error(msg: string): void;
  warn(msg: string): void;
  info(msg: string): void;
}
export declare function createToastStore(): ToastStore;
export declare function getToastStore(): ToastStore;
