/**
 * Toast notification store
 */
import type { Toast, ToastType } from "../types.ts";

export type { Toast, ToastType };

interface ToastMeta {
  remaining: number;
  lastStarted: number;
  timeoutId?: ReturnType<typeof setTimeout>;
}

export class ToastStore {
  toasts: Toast[] = $state<Toast[]>([]);
  #meta = new Map<string, ToastMeta>();

  /**
   * Add a new toast with FIFO eviction capped at exactly 5
   */
  send(
    message: string,
    type: ToastType = "info",
    duration: number = 3000,
  ): void {
    // Evict oldest if we are at cap (FIFO)
    while (this.toasts.length >= 5) {
      const oldest = this.toasts[0];
      this.dismiss(oldest.id);
    }

    // Generate id: use crypto.randomUUID if available, else fallback
    let id: string;
    if (
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ) {
      id = crypto.randomUUID();
    } else {
      id = "toast-" + Math.random().toString(36).substring(2, 9) + "-" +
        Date.now();
    }

    const toast: Toast = { id, message, type, duration };
    this.toasts.push(toast);

    if (duration > 0) {
      const meta: ToastMeta = {
        remaining: duration,
        lastStarted: Date.now(),
      };
      this.#meta.set(id, meta);

      meta.timeoutId = setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  /**
   * Remove a toast by id and clean up its active timer
   */
  dismiss(id: string): void {
    const meta = this.#meta.get(id);
    if (meta) {
      if (meta.timeoutId) {
        clearTimeout(meta.timeoutId);
      }
      this.#meta.delete(id);
    }
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  /**
   * Pause the auto-dismiss timer for a toast (e.g. on hover)
   */
  pause(id: string): void {
    const meta = this.#meta.get(id);
    if (meta && meta.timeoutId) {
      clearTimeout(meta.timeoutId);
      const elapsed = Date.now() - meta.lastStarted;
      meta.remaining = Math.max(0, meta.remaining - elapsed);
      meta.timeoutId = undefined;
    }
  }

  /**
   * Resume the auto-dismiss timer for a toast (e.g. on mouse leave)
   */
  resume(id: string): void {
    const meta = this.#meta.get(id);
    if (meta && !meta.timeoutId && meta.remaining > 0) {
      meta.lastStarted = Date.now();
      meta.timeoutId = setTimeout(() => {
        this.dismiss(id);
      }, meta.remaining);
    }
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
