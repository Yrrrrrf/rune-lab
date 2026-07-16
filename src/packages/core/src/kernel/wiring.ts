import { Context, Effect, Layer, ManagedRuntime, Schema } from "effect";
import type { ForgedPlugin, PluginInput } from "../forge/define-plugin.ts";
import type { SlotContext } from "../forge/define-slot.ts";
import type { PersistenceHandle } from "../forge/descriptors.ts";
import { createInMemoryDriver } from "../persistence/memory.ts";
import type { LocaleAdapter } from "../ports/locale.ts";
import type { PersistenceDriver } from "../ports/persistence.ts";
import type { TextMeasurer } from "../ports/text.ts";
import {
  makeLocaleAdapterLayer,
  makePersistenceLayer,
  makeStateCellsLayer,
  makeTextMeasurerLayer,
} from "../services/layers.ts";
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

export function normalizePlugins(inputs: PluginInput[]): ForgedPlugin[] {
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

function getPluginConfig(
  pluginId: string,
  config: Record<string, unknown>,
): unknown {
  if (config[pluginId] !== undefined) {
    return config[pluginId];
  }
  return config;
}

export function sortPlugins(resolved: ForgedPlugin[]): ForgedPlugin[] {
  const pluginMap = new Map(resolved.map((p) => [p.id, p]));
  const graphNodes: GraphNode[] = resolved.map((p) => ({
    id: p.id,
    dependsOn: p.requires ?? [],
  }));

  for (const node of graphNodes) {
    for (const reqId of node.dependsOn ?? []) {
      if (!pluginMap.has(reqId)) {
        throw new Error(
          `[Kernel] Missing requirement: Plugin "${node.id}" requires "${reqId}", but "${reqId}" is not provided.`,
        );
      }
    }
  }

  try {
    const sortedNodes = topologicalSort(graphNodes);
    return sortedNodes.map((node) => pluginMap.get(node.id)!);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`[Kernel] Circular dependency detected in plugins: ${msg}`);
  }
}

export function resolveSlotRef(
  ref: string,
  declaringPluginId: string,
  all: Map<string, NormalizedSlot>,
): NormalizedSlot {
  const bareId = `rl:${declaringPluginId}:${ref}`;
  if (all.has(bareId)) {
    return all.get(bareId)!;
  }

  if (ref.includes(".")) {
    const lastDot = ref.lastIndexOf(".");
    const otherPluginId = ref.slice(0, lastDot);
    const otherSlotName = ref.slice(lastDot + 1);
    const dottedId = `rl:${otherPluginId}:${otherSlotName}`;
    if (all.has(dottedId)) {
      return all.get(dottedId)!;
    }
  }

  throw new Error(
    `[Kernel] Cannot resolve slot reference "${ref}" declared in plugin "${declaringPluginId}"`,
  );
}

export function normalizeSlots(sorted: ForgedPlugin[]): NormalizedSlot[] {
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
        const resolvedSlot = resolveSlotRef(dep, plugin.id, allSlotsMap);

        if (resolvedSlot.pluginId !== plugin.id) {
          if (!plugin.requires?.includes(resolvedSlot.pluginId)) {
            throw new Error(
              `[Kernel] Invalid dependency: Slot "${slotName}" in plugin "${plugin.id}" depends on "${dep}", but "${resolvedSlot.pluginId}" is not in the requires spec of "${plugin.id}".`,
            );
          }
        }
        resolvedDeps.push(resolvedSlot.id);
      }
      slot.dependsOn = resolvedDeps;
    }
  }

  return allSlots;
}

export function sortSlots(slots: NormalizedSlot[]): NormalizedSlot[] {
  const slotGraphNodes: GraphNode[] = slots.map((s) => ({
    id: s.id,
    dependsOn: s.dependsOn,
  }));
  try {
    const sortedSlotNodes = topologicalSort(slotGraphNodes);
    return sortedSlotNodes.map((n) => slots.find((s) => s.id === n.id)!);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`[Kernel] Circular dependency detected in slots: ${msg}`);
  }
}

export function buildLayers(
  slots: NormalizedSlot[],
  options: {
    config: Record<string, unknown>;
    persistence: PersistenceDriver;
    localeAdapter?: LocaleAdapter;
    textMeasurer?: TextMeasurer;
  },
) {
  const cellsLayer = makeStateCellsLayer({
    contributions: {} as Record<string, unknown[]>,
  });

  let env: Layer.Layer<any, any, any> = Layer.merge(
    makePersistenceLayer(options.persistence),
    cellsLayer,
  );

  if (options.localeAdapter) {
    env = Layer.merge(env, makeLocaleAdapterLayer(options.localeAdapter));
  }
  if (options.textMeasurer) {
    env = Layer.merge(env, makeTextMeasurerLayer(options.textMeasurer));
  }

  for (const slot of slots) {
    const storeTag = Context.GenericTag<unknown>(slot.id);
    const storeLayer = Layer.effect(
      storeTag,
      Effect.gen(function* () {
        const pluginConfig = getPluginConfig(slot.pluginId, options.config);

        let configSlice = pluginConfig;
        if (slot.configSchema) {
          try {
            configSlice = Schema.decodeUnknownSync(
              slot.configSchema as Parameters<
                typeof Schema.decodeUnknownSync
              >[0],
            )(pluginConfig);
          } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : String(err);
            throw new Error(
              `[Kernel] Config validation failed for plugin "${slot.pluginId}", slot "${slot.slotName}": ${errMsg}`,
            );
          }
        }

        let persistenceHandle: PersistenceHandle;
        if (slot.persist) {
          const prefix = `rl:${slot.pluginId}:${slot.slotName}:`;
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

        let store: unknown = null;
        try {
          store = slot.create({
            config: configSlice,
            persistence: persistenceHandle,
            stores: resolvedDeps,
            locale: options.localeAdapter,
          });
        } catch (e) {
          console.error(`[Kernel] Failed to initialize slot "${slot.id}":`, e);
          throw e;
        }

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
                catch: (e) => e,
              }).pipe(
                Effect.catchAll((e) =>
                  Effect.sync(() => {
                    console.error(
                      `[Kernel] Error disposing store ${slot.id}:`,
                      e,
                    );
                  })
                ),
              )
            );
          }
        }

        return store;
      }),
    );

    env = Layer.provideMerge(storeLayer, env);
  }

  return env;
}

export function compileEnvironment(
  pluginsInput: PluginInput[],
  options: {
    config: Record<string, unknown>;
    persistence: PersistenceDriver;
    localeAdapter?: LocaleAdapter;
    textMeasurer?: TextMeasurer;
  },
): {
  runtime: ManagedRuntime.ManagedRuntime<any, any>;
  resolvedPlugins: ForgedPlugin[];
  sortedSlots: NormalizedSlot[];
} {
  const resolved = normalizePlugins(pluginsInput);
  const sortedPlugins = sortPlugins(resolved);
  const slots = normalizeSlots(sortedPlugins);
  const sortedSlots = sortSlots(slots);
  const env = buildLayers(sortedSlots, options);
  const runtime = ManagedRuntime.make(env as any);

  return {
    runtime,
    resolvedPlugins: resolved,
    sortedSlots,
  };
}
