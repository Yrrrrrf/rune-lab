import type { ToastStore, ToastType } from "./toast.svelte.ts";
/**
 * Notifies the global toast system.
 * If called before the ToastStore is initialized (e.g., in a module-level store),
 * it queues the toast and flushes it once wired.
 *
 * @clientOnly — Not safe for use in SSR contexts. Module-level state persists across requests.
 */
export declare function notify(
  message: string,
  type?: ToastType,
  duration?: number,
): void;
/**
 * Wires the global `notify` function to an active ToastStore instance.
 * Automatically flushes any queued toasts.
 */
export declare function wire(store: ToastStore): void;
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
export declare const createToastBridge: () => {
  notify: typeof notify;
  wire: typeof wire;
};
