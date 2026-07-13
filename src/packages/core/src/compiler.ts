import { Effect, Layer, ManagedRuntime, Schema } from "effect";
import {
  type PluginInput,
  resolvePlugins,
  type RunePlugin,
  type StoreRegistryEntry,
} from "./plugin/manifest.ts";
import { getCellSchema } from "./plugin/schemas.ts";
import type { LocaleAdapter } from "./ports/locale.ts";
import type { PersistenceDriver } from "./ports/persistence.ts";
import type { TextMeasurer } from "./ports/text.ts";
import { makeRegistryLayer, RegistryService } from "./registry/registry.ts";
import {
  createStoreLayer,
  makeLocaleAdapterLayer,
  makePersistenceLayer,
  makeStateCellsLayer,
  makeTextMeasurerLayer,
  StateCellsTag,
} from "./services/layers.ts";
import { topologicalSort } from "./utils/graph.ts";

function makeBackgroundSynchronizersLayer(options: {
  persistence: PersistenceDriver;
  localeAdapter?: LocaleAdapter;
}) {
  return Layer.scopedDiscard(
    Effect.gen(function* () {
      const cellsService = yield* StateCellsTag;
      const cells = cellsService.cells;

      if (options.persistence) {
        const p = options.persistence;
        const loadInitial = (key: string, fallback: unknown) =>
          Effect.tryPromise({
            try: async () => {
              const val = p.get(key);
              return val instanceof Promise ? await val : val;
            },
            catch: (e) => e,
          }).pipe(
            Effect.match({
              onFailure: () => {
                cells[key].set(fallback);
              },
              onSuccess: (val) => {
                if (val !== undefined && val !== null) {
                  const schema = getCellSchema(key, fallback);
                  try {
                    const decoded = Schema.decodeUnknownSync(schema)(val);
                    cells[key].set(decoded);
                  } catch {
                    cells[key].set(fallback);
                  }
                }
              },
            }),
          );

        const persistenceEffect = Effect.all([
          loadInitial("theme", "light"),
          loadInitial("language", "en"),
          loadInitial("currency", "USD"),
        ]);

        yield* Effect.forkScoped(persistenceEffect);
      }

      if (options.localeAdapter) {
        const la = options.localeAdapter;
        const localeEffect = Effect.acquireRelease(
          Effect.sync(() => {
            const initial = la.getLocale();
            if (initial) {
              cells.language.set(initial);
            }
            return la.onChange((lang) => {
              const current = cells.language.get();
              if (current !== lang) {
                cells.language.set(lang);
              }
            });
          }),
          (unsubscribe) => Effect.sync(() => unsubscribe()),
        ).pipe(Effect.flatMap(() => Effect.never));

        yield* Effect.forkScoped(localeEffect);
      }
    }),
  );
}

export interface Registry {
  register(entry: StoreRegistryEntry): void;
  get(id: string): StoreRegistryEntry | undefined;
  entries(): StoreRegistryEntry[];
  clear(): void;
}

export interface CompiledEnvironment {
  // deno-lint-ignore no-explicit-any
  runtime: ManagedRuntime.ManagedRuntime<any, any>;
  resolvedPlugins: RunePlugin[];
  sortedEntries: StoreRegistryEntry[];
  registry: Registry;
}

export function compileEnvironment(
  pluginsInput: PluginInput[],
  options: {
    config: Record<string, unknown>;
    persistence: PersistenceDriver;
    localeAdapter?: LocaleAdapter;
    textMeasurer?: TextMeasurer;
  },
): CompiledEnvironment {
  const resolved = resolvePlugins(pluginsInput);

  // Create isolated registry layer
  const registryLayer = makeRegistryLayer();

  // Create a temporary runtime to populate the registry
  const tempRuntime = ManagedRuntime.make(registryLayer);
  const registry = tempRuntime.runSync(RegistryService);

  for (const plugin of resolved) {
    for (const slot of plugin.stores) {
      if (!slot.pluginId) {
        slot.pluginId = plugin.id;
      }
      registry.register(slot);
    }
  }

  const entries = registry.entries();

  // Pre-flight dependency graph validation
  const entryIds = new Set(entries.map((e) => e.id));
  for (const entry of entries) {
    for (const depId of entry.dependsOn ?? []) {
      if (!entryIds.has(depId)) {
        throw new Error(
          `[Kernel] Missing dependency: Store "${entry.id}" depends on "${depId}", but "${depId}" is not registered in the registry.`,
        );
      }
    }
  }

  const sorted = topologicalSort(entries);

  // Initialize cells layer with standard keys
  const cellsLayer = makeStateCellsLayer({
    theme: "light",
    language: "en",
    currency: "USD",
    contributions: {} as Record<string, unknown[]>,
  });

  // Assemble base environment layers
  // deno-lint-ignore no-explicit-any
  let env: Layer.Layer<any, any, any> = Layer.merge(
    makePersistenceLayer(options.persistence),
    cellsLayer,
  );
  env = Layer.merge(env, registryLayer);

  if (options.localeAdapter) {
    env = Layer.merge(env, makeLocaleAdapterLayer(options.localeAdapter));
  }
  if (options.textMeasurer) {
    env = Layer.merge(env, makeTextMeasurerLayer(options.textMeasurer));
  }

  for (const entry of sorted) {
    const storeLayer = createStoreLayer(entry, options.config);
    env = Layer.provideMerge(storeLayer, env);
  }

  // Merge the background synchronizers layer
  const synchronizersLayer = makeBackgroundSynchronizersLayer(options);
  env = Layer.provideMerge(synchronizersLayer, env);

  // deno-lint-ignore no-explicit-any
  const runtime = ManagedRuntime.make(env as Layer.Layer<any, any, never>);

  return {
    runtime,
    resolvedPlugins: resolved,
    sortedEntries: sorted,
    registry,
  };
}
