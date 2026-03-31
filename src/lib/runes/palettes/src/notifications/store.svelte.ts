/**
 * Toast notification store
 */
import { getToastStore } from "@rune-lab/kernel";
import type { Toast, ToastType } from "@rune-lab/kernel";

export type { Toast, ToastType };

export class ToastStore {
  toasts: Toast[] = $state<Toast[]>([]);

  /**
   * Add a new toast
   */
  send(
    message: string,
    type: ToastType = "info",
    duration: number = 3000,
  ): void {
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
  dismiss(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  // Helper methods
  success(msg: string): void {
    this.send(msg, "success");
  }
  error(msg: string): void {
    this.send(msg, "error");
  }
  warn(msg: string): void {
    this.send(msg, "warning");
  }
  info(msg: string): void {
    this.send(msg, "info");
  }
}

export function createToastStore(): ToastStore {
  return new ToastStore();
}

export { getToastStore };
