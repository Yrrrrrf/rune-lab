/**
 * Toast notification store
 */
export type ToastType = "info" | "success" | "warning" | "error";
import { getContext } from "svelte";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export class ToastStore {
  toasts = $state<Toast[]>([]);

  /**
   * Add a new toast
   */
  send(message: string, type: ToastType = "info", duration: number = 3000) {
    const id = crypto.randomUUID();
    const toast: Toast = { id, message, type, duration };

    this.toasts.push(toast);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  /**
   * Remove a toast by id
   */
  dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  // Helper methods
  success(msg: string) {
    this.send(msg, "success");
  }
  error(msg: string) {
    this.send(msg, "error");
  }
  warn(msg: string) {
    this.send(msg, "warning");
  }
  info(msg: string) {
    this.send(msg, "info");
  }
}

export function createToastStore() {
  return new ToastStore();
}

export function getToastStore() {
  return getContext<ToastStore>("rl:toast");
}
