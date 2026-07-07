import { describe, expect, it, vi } from "vite-plus/test";
import { ToastStore } from "./store.svelte.ts";

describe("ToastStore", () => {
  it("should initialize with empty toasts", () => {
    const store = new ToastStore();
    expect(store.toasts).toEqual([]);
  });

  it("should cap at exactly 5 toasts and evict the oldest first (FIFO)", () => {
    const store = new ToastStore();
    store.send("Msg 1");
    store.send("Msg 2");
    store.send("Msg 3");
    store.send("Msg 4");
    store.send("Msg 5");

    expect(store.toasts.length).toBe(5);
    expect(store.toasts[0].message).toBe("Msg 1");

    store.send("Msg 6");
    expect(store.toasts.length).toBe(5);
    expect(store.toasts[0].message).toBe("Msg 2");
    expect(store.toasts.map((t) => t.message)).toEqual([
      "Msg 2",
      "Msg 3",
      "Msg 4",
      "Msg 5",
      "Msg 6",
    ]);
  });

  it("should generate valid fallback IDs when crypto is not present", () => {
    const store = new ToastStore();
    const originalCrypto = globalThis.crypto;
    // Temporarily hide crypto
    // @ts-ignore: Mocking globalThis.crypto for test
    delete globalThis.crypto;

    try {
      store.send("No crypto id test");
      expect(store.toasts.length).toBe(1);
      expect(store.toasts[0].id).toContain("toast-");
    } finally {
      // Restore crypto
      globalThis.crypto = originalCrypto;
    }
  });

  it("should dismiss a toast manually and clean up its timer", () => {
    vi.useFakeTimers();
    try {
      const store = new ToastStore();
      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

      store.send("Timer test", "info", 5000);
      const toastId = store.toasts[0].id;

      store.dismiss(toastId);
      expect(store.toasts).toEqual([]);
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    } finally {
      vi.useRealTimers();
    }
  });

  it("should pause auto-dismiss timer on pause() and resume on resume()", () => {
    vi.useFakeTimers();
    try {
      const store = new ToastStore();
      store.send("Pause test", "info", 1000);
      const toastId = store.toasts[0].id;

      // Advance time by 400ms
      vi.advanceTimersByTime(400);

      // Hover: pause
      store.pause(toastId);

      // Advance time by another 1000ms. Toast should still be present because it was paused!
      vi.advanceTimersByTime(1000);
      expect(store.toasts.length).toBe(1);

      // Leave: resume. Remaining duration should be 600ms.
      store.resume(toastId);

      // Advance 500ms. Still present.
      vi.advanceTimersByTime(500);
      expect(store.toasts.length).toBe(1);

      // Advance final 100ms. Toast should be dismissed.
      vi.advanceTimersByTime(100);
      expect(store.toasts.length).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
