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
		this.notify();
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
				// Sanctioned exception to the no-try/catch rule (see W1-02): this
				// isolates a foreign subscriber callback so one throwing listener
				// cannot break notification for every other listener.
				try {
					listener();
				} catch (e) {
					console.error(`[StateCell] Listener error:`, e);
				}
			}
		});
	}
}
