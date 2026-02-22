import type { ToastStore, ToastType } from "./toast.svelte";

interface QueuedToast {
  message: string;
  type: ToastType;
  duration?: number;
}

const queue: QueuedToast[] = [];
let activeStore: ToastStore | null = null;

/**
 * Notifies the global toast system.
 * If called before the ToastStore is initialized (e.g., in a module-level store),
 * it queues the toast and flushes it once wired.
 *
 * @clientOnly — Not safe for use in SSR contexts. Module-level state persists across requests.
 */
export function notify(
  message: string,
  type: ToastType = "info",
  duration?: number,
) {
  if (typeof window === "undefined") return; // No-op on server

  if (activeStore) {
    activeStore.send(message, type, duration ?? 3000);
  } else {
    queue.push({ message, type, duration });
  }
}

/**
 * Wires the global `notify` function to an active ToastStore instance.
 * Automatically flushes any queued toasts.
 */
export function wire(store: ToastStore) {
  activeStore = store;
  while (queue.length > 0) {
    const next = queue.shift();
    if (next) store.send(next.message, next.type, next.duration ?? 3000);
  }
}

/**
 * Escape hatch for module-level stores to send toasts without Svelte context.
 *
 * @example
 * ```ts
 * import { createToastBridge } from "rune-lab";
 * const { notify } = createToastBridge();
 *
 * notify("Logged in successfully", "success");
 * ```
 */
export const createToastBridge = () => ({ notify, wire });
