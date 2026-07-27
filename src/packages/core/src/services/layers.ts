import { Context, Effect, Layer, Stream, SubscriptionRef } from "effect";
import { StateCell } from "../cells/define-cell.ts";

export interface StateCells {
	readonly cells: Record<string, StateCell<unknown>>;
}

export const StateCellsTag = Context.GenericTag<StateCells>(
	"rune-lab/core/StateCells",
);

const makeCell = (key: string, value: unknown) =>
	Effect.gen(function* () {
		const ref = yield* SubscriptionRef.make(value);
		const cell = new StateCell(ref);
		const watcher = Stream.runForEach(ref.changes, () =>
			Effect.sync(() => {
				cell.notify();
			}),
		);
		yield* Effect.forkScoped(watcher);
		return [key, cell] as const;
	});

export const makeStateCellsLayer = (initialValues: Record<string, unknown>) =>
	Layer.scoped(
		StateCellsTag,
		Effect.gen(function* () {
			const entries = Object.entries(initialValues);
			const results = yield* Effect.forEach(
				entries,
				([key, value]) => makeCell(key, value),
				{ concurrency: "unbounded" },
			);
			const cells = Object.fromEntries(results);
			return { cells };
		}),
	);
