import type { Stream } from "effect";
import { Effect, SubscriptionRef } from "effect";

export class StateCell<T> {
  version = 0;
  private listeners = new Set<() => void>();

  constructor(public ref: SubscriptionRef.SubscriptionRef<T>) {}

  get(): T {
    return Effect.runSync(SubscriptionRef.get(this.ref));
  }

  set(value: T): void {
    Effect.runSync(SubscriptionRef.set(this.ref, value));
  }

  getVersion(): number {
    return this.version;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private pendingNotify = false;

  notify(): void {
    this.version++;
    if (this.pendingNotify) return;
    this.pendingNotify = true;
    queueMicrotask(() => {
      this.pendingNotify = false;
      for (const listener of this.listeners) {
        try {
          listener();
        } catch (e) {
          console.error(`[StateCell] Listener error:`, e);
        }
      }
    });
  }

  getStream(): Stream.Stream<T, never, never> {
    return this.ref.changes;
  }
}

export function defineCell<T>(
  initialValue: T,
): Effect.Effect<StateCell<T>, never, never> {
  return Effect.gen(function* () {
    const ref = yield* SubscriptionRef.make(initialValue);
    return new StateCell(ref);
  });
}
