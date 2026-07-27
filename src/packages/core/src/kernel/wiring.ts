import {
  Context,
  Effect,
  Either,
  Layer,
  ManagedRuntime,
  Option,
  Schema,
} from "effect";
import {
  CircularPluginDependency,
  CircularSlotDependency,
  MissingRequirement,
  SlotConfigInvalid,
  SlotDisposeFailed,
  SlotInitFailed,
  UndeclaredCrossPluginDependency,
  UnresolvableSlotRef,
} from "../errors.ts";
import type { ForgedPlugin, PluginInput } from "../forge/define-plugin.ts";
import type { SlotContext } from "../forge/define-slot.ts";
import type { PersistenceHandle } from "../forge/descriptors.ts";
import { createInMemoryDriver } from "../persistence/memory.ts";
import type { LocaleAdapter } from "../ports/locale.ts";
import type { PersistenceDriver } from "../ports/persistence.ts";
import type { TextMeasurer } from "../ports/text.ts";
import { makeStateCellsLayer } from "../services/layers.ts";
import { type GraphNode, topologicalSort } from "../utils/graph.ts";

export interface NormalizedSlot {
  id: string; // Global unique identifier in Effect (namespaced)
  slotName: string;
  pluginId: string;
  contextKey: symbol;
  dependsOn: string[];
  expose: boolean;
  persist?: boolean | string[];
  configSchema?: unknown;
  create: (context: SlotContext<unknown>) => unknown;
}

/**
 * Every failure mode `compileEnvironment` can produce, pre-runtime. These are
 * plain synchronous functions running before `ManagedRuntime.make`, so they
 * are not in an Effect context — they return `Either` rather than `Effect.fail`.
 */
export type CompileError =
  | MissingRequirement
  | CircularPluginDependency
  | CircularSlotDependency
  | UnresolvableSlotRef
  | UndeclaredCrossPluginDependency;

function normalizePlugins(inputs: PluginInput[]): ForgedPlugin[] {
  const flat: ForgedPlugin[] = [];
  function process(item: PluginInput) {
    if (!item) return;
    if (Array.isArray(item)) {
      for (const sub of item) {
        process(sub);
      }
    } else if (typeof item === "object") {
      flat.push(item as ForgedPlugin);
    }
  }
  for (const item of inputs) {
    process(item);
  }
  const seen = new Set<string>();
  return flat.filter((p): p is ForgedPlugin => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

function sortPlugins(
  resolved: ForgedPlugin[],
): Either.Either<ForgedPlugin[], CompileError> {
  const pluginMap = new Map(resolved.map((p) => [p.id, p]));
  const graphNodes: GraphNode[] = resolved.map((p) => ({
    id: p.id,
    dependsOn: p.requires ?? [],
  }));

  for (const node of graphNodes) {
    for (const reqId of node.dependsOn ?? []) {
      if (!pluginMap.has(reqId)) {
        return Either.left(
          new MissingRequirement({ pluginId: node.id, requiredId: reqId }),
        );
      }
    }
  }

  const sortedResult = topologicalSort(graphNodes);
  if (Either.isLeft(sortedResult)) {
    return Either.left(
      new CircularPluginDependency({ cycle: sortedResult.left.cycle }),
    );
  }
  return Either.right(
    sortedResult.right.map((node) => pluginMap.get(node.id)!),
  );
}

export function resolveSlotRef(
  ref: string,
  declaringPluginId: string,
  all: Map<string, NormalizedSlot>,
): Option.Option<NormalizedSlot> {
  const bareId = `rl:${declaringPluginId}:${ref}`;
  if (all.has(bareId)) {
    return Option.some(all.get(bareId)!);
  }

  if (ref.includes(".")) {
    const lastDot = ref.lastIndexOf(".");
    const otherPluginId = ref.slice(0, lastDot);
    const otherSlotName = ref.slice(lastDot + 1);
    const dottedId = `rl:${otherPluginId}:${otherSlotName}`;
    if (all.has(dottedId)) {
      return Option.some(all.get(dottedId)!);
    }
  }

  return Option.none();
}

export function normalizeSlots(
  sorted: ForgedPlugin[],
): Either.Either<NormalizedSlot[], CompileError> {
  const allSlots: NormalizedSlot[] = [];
  const allSlotsMap = new Map<string, NormalizedSlot>();

  for (const plugin of sorted) {
    const slots = plugin.slots || {};
    for (const [slotName, slotSpec] of Object.entries(slots)) {
      const slotId = `rl:${plugin.id}:${slotName}`;
      const descriptor = plugin.descriptors[slotName];
      const slot: NormalizedSlot = {
        id: slotId,
        slotName,
        pluginId: plugin.id,
        contextKey: descriptor.contextKey,
        dependsOn: [],
        expose: slotSpec.expose !== false,
        persist: slotSpec.persist,
        configSchema: slotSpec.config,
        create: slotSpec.create,
      };
      allSlots.push(slot);
      allSlotsMap.set(slotId, slot);
    }
  }

  for (const plugin of sorted) {
    const slots = plugin.slots || {};
    for (const [slotName, slotSpec] of Object.entries(slots)) {
      const slotId = `rl:${plugin.id}:${slotName}`;
      const slot = allSlotsMap.get(slotId)!;

      const resolvedDeps: string[] = [];
      for (const dep of slotSpec.dependsOn ?? []) {
        const resolvedOpt = resolveSlotRef(dep, plugin.id, allSlotsMap);
        if (Option.isNone(resolvedOpt)) {
          return Either.left(
            new UnresolvableSlotRef({ ref: dep, declaringPluginId: plugin.id }),
          );
        }
        const resolvedSlot = resolvedOpt.value;

        if (resolvedSlot.pluginId !== plugin.id) {
          if (!plugin.requires?.includes(resolvedSlot.pluginId)) {
            return Either.left(
              new UndeclaredCrossPluginDependency({
                slotName,
                pluginId: plugin.id,
                dep,
                targetPluginId: resolvedSlot.pluginId,
              }),
            );
          }
        }
        resolvedDeps.push(resolvedSlot.id);
      }
      slot.dependsOn = resolvedDeps;
    }
  }

  return Either.right(allSlots);
}

function sortSlots(
  slots: NormalizedSlot[],
): Either.Either<NormalizedSlot[], CompileError> {
  const slotGraphNodes: GraphNode[] = slots.map((s) => ({
    id: s.id,
    dependsOn: s.dependsOn,
  }));
  const sortedResult = topologicalSort(slotGraphNodes);
  if (Either.isLeft(sortedResult)) {
    return Either.left(
      new CircularSlotDependency({ cycle: sortedResult.left.cycle }),
    );
  }
  return Either.right(
    sortedResult.right.map((n) => slots.find((s) => s.id === n.id)!),
  );
}

function buildLayers(
  slots: NormalizedSlot[],
  options: {
    persistence: PersistenceDriver;
    localeAdapter?: LocaleAdapter;
    textMeasurer?: TextMeasurer;
    pluginConfig?: Record<string, Record<string, unknown>>;
  },
): Layer.Layer<unknown, never, never> {
  let env = makeStateCellsLayer({
    contributions: new Map<unknown, unknown[]>(),
  }) as Layer.Layer<unknown, never, never>;

  for (const slot of slots) {
    const storeTag = Context.GenericTag<unknown>(slot.id);
    const storeLayer = Layer.effect(
      storeTag,
      Effect.gen(function* () {
        const rawConfig = options.pluginConfig?.[slot.pluginId]
          ?.[slot.slotName];
        let configSlice: unknown = rawConfig;
        if (slot.configSchema) {
          if (rawConfig !== undefined) {
            const decoded = Schema.decodeUnknownEither(
              slot.configSchema as Parameters<
                typeof Schema.decodeUnknownEither
              >[0],
            )(rawConfig);
            if (Either.isLeft(decoded)) {
              const parseError = decoded.left.message ?? String(decoded.left);
              return yield* Effect.fail(
                new SlotConfigInvalid({
                  pluginId: slot.pluginId,
                  slotName: slot.slotName,
                  parseError,
                }),
              );
            }
            configSlice = decoded.right;
          } else {
            configSlice = undefined;
          }
        }

        let persistenceHandle: PersistenceHandle;
        if (slot.persist) {
          const prefix = `${slot.pluginId}:${slot.slotName}:`;
          persistenceHandle = {
            get: (key) => options.persistence.get(`${prefix}${key}`),
            set: (key, value) =>
              options.persistence.set(`${prefix}${key}`, value),
            remove: (key) => options.persistence.remove(`${prefix}${key}`),
          };
        } else {
          const mem = createInMemoryDriver();
          persistenceHandle = {
            get: (key) => mem.get(key),
            set: (key, value) => mem.set(key, value),
            remove: (key) => mem.remove(key),
          };
        }

        const resolvedDeps = new Map<string, unknown>();
        for (const depId of slot.dependsOn) {
          const depTag = Context.GenericTag<unknown>(depId);
          const depStore = yield* depTag;
          resolvedDeps.set(depId, depStore);
          if (depId.startsWith("rl:")) {
            const parts = depId.split(":");
            resolvedDeps.set(parts[parts.length - 1], depStore);
          }
        }

        const store = yield* Effect.try({
          try: () =>
            slot.create({
              config: configSlice,
              persistence: persistenceHandle,
              stores: resolvedDeps,
              locale: options.localeAdapter,
              textMeasurer: options.textMeasurer,
            }),
          catch: (cause) => new SlotInitFailed({ slotId: slot.id, cause }),
        });

        if (store !== null && store !== undefined) {
          const storeObj = store as Record<string, unknown>;
          const hasDispose = typeof storeObj.dispose === "function";
          if (hasDispose) {
            yield* Effect.addFinalizer(() =>
              Effect.tryPromise({
                try: async () => {
                  const res = (storeObj.dispose as () => unknown)();
                  if (res instanceof Promise) await res;
                },
                catch: (cause) =>
                  new SlotDisposeFailed({ slotId: slot.id, cause }),
              }).pipe(Effect.orDie)
            );
          }
        }

        return store;
      }),
    );

    env = Layer.provideMerge(storeLayer, env) as Layer.Layer<
      unknown,
      never,
      never
    >;
  }

  return env;
}

type KernelRuntime = ManagedRuntime.ManagedRuntime<unknown, never>;

export function compileEnvironment(
  pluginsInput: PluginInput[],
  options: {
    persistence: PersistenceDriver;
    localeAdapter?: LocaleAdapter;
    textMeasurer?: TextMeasurer;
    pluginConfig?: Record<string, Record<string, unknown>>;
  },
): Either.Either<
  {
    runtime: KernelRuntime;
    resolvedPlugins: ForgedPlugin[];
    sortedSlots: NormalizedSlot[];
  },
  CompileError
> {
  const resolved = normalizePlugins(pluginsInput);

  const sortedPluginsResult = sortPlugins(resolved);
  if (Either.isLeft(sortedPluginsResult)) {
    return Either.left(sortedPluginsResult.left);
  }

  const slotsResult = normalizeSlots(sortedPluginsResult.right);
  if (Either.isLeft(slotsResult)) {
    return Either.left(slotsResult.left);
  }

  const sortedSlotsResult = sortSlots(slotsResult.right);
  if (Either.isLeft(sortedSlotsResult)) {
    return Either.left(sortedSlotsResult.left);
  }
  const sortedSlots = sortedSlotsResult.right;

  const env = buildLayers(sortedSlots, options);
  const runtime = ManagedRuntime.make(env);

  return Either.right({
    runtime,
    resolvedPlugins: resolved,
    sortedSlots,
  });
}
