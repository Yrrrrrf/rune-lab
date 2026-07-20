import { Context, Effect, Layer, Stream, SubscriptionRef } from "effect";
import { StateCell } from "../cells/define-cell.ts";

import type { LocaleAdapter } from "../ports/locale.ts";
import type { PersistenceDriver } from "../ports/persistence.ts";

const PersistenceDriverTag = Context.GenericTag<PersistenceDriver>(
  "rune-lab/core/PersistenceDriver",
);

const LocaleAdapterTag = Context.GenericTag<LocaleAdapter>(
  "rune-lab/core/LocaleAdapter",
);

export interface StateCells {
  readonly cells: Record<string, StateCell<unknown>>;
}

export const StateCellsTag = Context.GenericTag<StateCells>(
  "rune-lab/core/StateCells",
);

export const makePersistenceLayer = (driver: PersistenceDriver) =>
  Layer.succeed(PersistenceDriverTag, driver);

export const makeLocaleAdapterLayer = (adapter: LocaleAdapter) =>
  Layer.succeed(LocaleAdapterTag, adapter);

const makeCell = (key: string, value: unknown) =>
  Effect.gen(function* () {
    const ref = yield* SubscriptionRef.make(value);
    const cell = new StateCell(ref);
    const watcher = Stream.runForEach(ref.changes, () =>
      Effect.sync(() => {
        cell.notify();
      }));
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
