import { Context, Effect, Layer, Stream, SubscriptionRef } from "effect";
import { StateCell } from "../cells/define-cell.ts";
import { createInMemoryDriver } from "../persistence/memory.ts";
import type { StoreRegistryEntry } from "../plugin/manifest.ts";
import type { LocaleAdapter } from "../ports/locale.ts";
import type { PersistenceDriver } from "../ports/persistence.ts";
import type { TextMeasurer } from "../ports/text.ts";

const PersistenceDriverTag = Context.GenericTag<PersistenceDriver>(
  "@rune-lab/core/PersistenceDriver",
);

const LocaleAdapterTag = Context.GenericTag<LocaleAdapter>(
  "@rune-lab/core/LocaleAdapter",
);

const TextMeasurerTag = Context.GenericTag<TextMeasurer>(
  "@rune-lab/core/TextMeasurer",
);

export interface StateCells {
  readonly cells: Record<string, StateCell<unknown>>;
}

export const StateCellsTag = Context.GenericTag<StateCells>(
  "@rune-lab/core/StateCells",
);

export const makePersistenceLayer = (driver: PersistenceDriver) =>
  Layer.succeed(PersistenceDriverTag, driver);

export const makeLocaleAdapterLayer = (adapter: LocaleAdapter) =>
  Layer.succeed(LocaleAdapterTag, adapter);

export const makeTextMeasurerLayer = (measurer: TextMeasurer) =>
  Layer.succeed(TextMeasurerTag, measurer);

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

function getPluginConfig(
  entry: StoreRegistryEntry,
  config: Record<string, unknown>,
): unknown {
  if (entry.pluginId && config[entry.pluginId]) {
    return config[entry.pluginId];
  }
  return config;
}

function getPersistenceDriver(entry: StoreRegistryEntry) {
  return entry.noPersistence
    ? Effect.succeed(createInMemoryDriver())
    : PersistenceDriverTag;
}

function resolveStoreDependencies(dependsOn: string[] | undefined) {
  const depsArray = dependsOn ?? [];
  return Effect.forEach(
    depsArray,
    (depId) =>
      Effect.gen(function* () {
        const depTag = Context.GenericTag<unknown>(depId);
        const depStore = yield* depTag;
        return [depId, depStore] as const;
      }),
    { concurrency: "unbounded" },
  ).pipe(Effect.map((results) => new Map(results)));
}

function registerStoreFinalizer(store: unknown, storeId: string) {
  const hasDispose = store &&
    typeof (store as { dispose?: unknown }).dispose === "function";
  if (!hasDispose) return Effect.void;

  return Effect.addFinalizer(() =>
    Effect.tryPromise({
      try: async () => {
        const res = (store as { dispose: () => unknown }).dispose();
        if (res instanceof Promise) {
          await res;
        }
      },
      catch: (e) => e,
    }).pipe(
      Effect.catchAll((e) =>
        Effect.sync(() => {
          console.error(`[Kernel] Error disposing store ${storeId}:`, e);
        })
      ),
    )
  );
}

export function createStoreLayer(
  entry: StoreRegistryEntry,
  config: Record<string, unknown>,
) {
  const storeTag = Context.GenericTag<unknown>(entry.id);
  return Layer.effect(
    storeTag,
    Effect.gen(function* () {
      const pluginConfig = getPluginConfig(entry, config);
      const driver = yield* getPersistenceDriver(entry);
      const deps = yield* resolveStoreDependencies(entry.dependsOn);

      let store: unknown = null;
      try {
        store = entry.factory(pluginConfig, driver, deps);
      } catch (e) {
        console.error(`[Kernel] Failed to initialize store "${entry.id}":`, e);
      }

      if (store !== null && store !== undefined) {
        yield* registerStoreFinalizer(store, entry.id);
      }

      return store;
    }),
  );
}
