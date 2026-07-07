import { Effect, SubscriptionRef } from "effect";
import type { Stream } from "effect";

export class StateCell<T> {
  version = 0;
  private listeners = new Set<() => void>();

  constructor(public ref: SubscriptionRef.SubscriptionRef<T>) {}

  // fallow-ignore-next-line unused-class-member
  get(): T {
    return Effect.runSync(SubscriptionRef.get(this.ref));
  }

  // fallow-ignore-next-line unused-class-member
  set(value: T): void {
    Effect.runSync(SubscriptionRef.set(this.ref, value));
  }

  // fallow-ignore-next-line unused-class-member
  getVersion(): number {
    return this.version;
  }

  // fallow-ignore-next-line unused-class-member
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify(): void {
    this.version++;
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (e) {
        console.error(`[StateCell] Listener error:`, e);
      }
    }
  }

  // fallow-ignore-next-line unused-class-member
  getStream(): Stream.Stream<T, never, never> {
    return this.ref.changes;
  }
}
