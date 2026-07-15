import { Context, Effect, Layer, ManagedRuntime, Schema } from "effect";
import type { ForgedPlugin, PluginInput } from "../forge/define-plugin.ts";
import type { RunePlugin } from "../plugin/manifest.ts";
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
  id: string; // Global unique identifier in Effect (namespaced or legacy)
  slotName: string;
  pluginId: string;
  contextKey: symbol;
  dependsOn: string[];
  expose: boolean;
  persist?: boolean | string[];
  configSchema?: unknown;
  create: (context: SlotContext<unknown>) => unknown;
  isLegacy: boolean;
  legacyFactory?: (
    config: unknown,
    driver: PersistenceDriver,
    stores: Map<string, unknown>,
  ) => unknown;
}

export function normalizePlugins(inputs: PluginInput[]): ForgedPlugin[] {
  const flat: Array<ForgedPlugin | RunePlugin> = [];
  function process(item: PluginInput) {
    if (!item) return;
    if (Array.isArray(item)) {
      for (const sub of item) {
        process(sub);
      }
    } else if (typeof item === "object") {
      flat.push(item as ForgedPlugin | RunePlugin);
    }
  }
  for (const item of inputs) {
    process(item);
  }
  const seen = new Set<string>();
  return flat.filter((p): p is ForgedPlugin => {
    if (seen.has(p.id as string)) return false;
    seen.add(p.id as string);
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

export function compileEnvironment(
  pluginsInput: PluginInput[],
  options: {
    config: Record<string, unknown>;
    persistence: PersistenceDriver;
    localeAdapter?: LocaleAdapter;
    textMeasurer?: TextMeasurer;
  },
): {
  // deno-lint-ignore no-explicit-any
  runtime: ManagedRuntime.ManagedRuntime<any, any>;
  resolvedPlugins: ForgedPlugin[];
  sortedSlots: NormalizedSlot[];
} {
  const resolved = normalizePlugins(pluginsInput);

  // 1. Plugin-level topological sort and validation
  const pluginMap = new Map(resolved.map((p) => [p.id, p]));
  const graphNodes: GraphNode[] = resolved.map((p) => ({
    id: p.id,
    dependsOn: p.requires ?? [],
  }));

  // Verify missing requirements
  for (const node of graphNodes) {
    for (const reqId of node.dependsOn ?? []) {
      if (!pluginMap.has(reqId)) {
        throw new Error(
          `[Kernel] Missing requirement: Plugin "${node.id}" requires "${reqId}", but "${reqId}" is not provided.`,
        );
      }
    }
  }

  // Topological sort
  let sortedPlugins: ForgedPlugin[];
  try {
    const sortedNodes = topologicalSort(graphNodes);
    sortedPlugins = sortedNodes.map((node) => pluginMap.get(node.id)!);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `[Kernel] Circular dependency detected in plugins: ${msg}`,
    );
  }

  // 2. Normalize and validate all slots
  const allSlots: NormalizedSlot[] = [];
  for (const plugin of sortedPlugins) {
    if (plugin.stores && Array.isArray(plugin.stores)) {
      // Legacy stores
      for (const store of plugin.stores) {
        const slotId = store.id; // Legacy uses raw store ID
        allSlots.push({
          id: slotId,
          slotName: store.id,
          pluginId: plugin.id,
          contextKey: store.contextKey || Symbol.for(`rl:${store.id}`),
          dependsOn: store.dependsOn ?? [],
          expose: true,
          persist: !store.noPersistence,
          create: (ctx) =>
            store.factory(ctx.config, ctx.persistence, ctx.stores),
          isLegacy: true,
          legacyFactory: store.factory,
        });
      }
    } else {
      // New slots
      const slots = plugin.slots || {};
      for (const [slotName, slotSpec] of Object.entries(slots)) {
        const slotId = `rl:${plugin.id}:${slotName}`;
        const descriptor = plugin.descriptors[slotName];

        // Resolve dependencies
        const resolvedDeps: string[] = [];
        for (const dep of slotSpec.dependsOn ?? []) {
          if (dep.includes(".")) {
            // Cross-plugin dependency: otherPluginId.slotName
            const parts = dep.split(".");
            const otherPluginId = parts.slice(0, -1).join(".");
            const otherSlotName = parts[parts.length - 1];

            // Verify the required plugin is in our requires list
            if (!plugin.requires?.includes(otherPluginId)) {
              throw new Error(
                `[Kernel] Invalid dependency: Slot "${slotName}" in plugin "${plugin.id}" depends on "${dep}", but "${otherPluginId}" is not in the requires spec of "${plugin.id}".`,
              );
            }
            resolvedDeps.push(`rl:${otherPluginId}:${otherSlotName}`);
          } else {
            // Local dependency within the same plugin
            resolvedDeps.push(`rl:${plugin.id}:${dep}`);
          }
        }

        allSlots.push({
          id: slotId,
          slotName,
          pluginId: plugin.id,
          contextKey: descriptor.contextKey,
          dependsOn: resolvedDeps,
          expose: slotSpec.expose !== false,
          persist: slotSpec.persist,
          configSchema: slotSpec.config,
          create: slotSpec.create,
          isLegacy: false,
        });
      }
    }
  }

  // Validate slot dependencies
  const slotIdSet = new Set(allSlots.map((s) => s.id));
  for (const slot of allSlots) {
    for (const depId of slot.dependsOn) {
      if (!slotIdSet.has(depId)) {
        // Fallback for legacy compatibility
        if (slot.isLegacy && !depId.startsWith("rl:")) {
          continue; // Allow un-prefixed legacy store dependencies
        }
        throw new Error(
          `[Kernel] Missing dependency: Slot "${slot.id}" depends on "${depId}", which is not registered.`,
        );
      }
    }
  }

  // Sort slots topologically
  const slotGraphNodes: GraphNode[] = allSlots.map((s) => ({
    id: s.id,
    dependsOn: s.dependsOn,
  }));
  const sortedSlotNodes = topologicalSort(slotGraphNodes);
  const sortedSlots = sortedSlotNodes.map(
    (n) => allSlots.find((s) => s.id === n.id)!,
  );

  // Initialize cells layer
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

  if (options.localeAdapter) {
    env = Layer.merge(env, makeLocaleAdapterLayer(options.localeAdapter));
  }
  if (options.textMeasurer) {
    env = Layer.merge(env, makeTextMeasurerLayer(options.textMeasurer));
  }

  // Create store layers
  for (const slot of sortedSlots) {
    const storeTag = Context.GenericTag<unknown>(slot.id);
    const storeLayer = Layer.effect(
      storeTag,
      Effect.gen(function* () {
        const pluginConfig = getPluginConfig(slot.pluginId, options.config);

        // Validate config if schema exists
        let configSlice = pluginConfig;
        if (!slot.isLegacy) {
          // In new format, the config passed to slot is config[slotName] or config directly?
          // The spec says: config validation validates that plugin's config slice.
          // Usually pluginConfig is the whole plugin's config slice. Let's validate it if slot.configSchema exists.
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
        }

        // Build namespaced persistence handle
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

        // Resolve dependencies
        const resolvedDeps = new Map<string, unknown>();
        for (const depId of slot.dependsOn) {
          const depTag = Context.GenericTag<unknown>(depId);
          const depStore = yield* depTag;
          resolvedDeps.set(depId, depStore);
          // Legacy support: also set un-prefixed name in the map
          if (depId.startsWith("rl:")) {
            const parts = depId.split(":");
            resolvedDeps.set(parts[parts.length - 1], depStore);
          }
        }

        let store: unknown = null;
        try {
          if (slot.isLegacy) {
            store = slot.create({
              config: pluginConfig,
              persistence: options.persistence,
              stores: resolvedDeps,
            });
          } else {
            store = slot.create({
              config: configSlice,
              persistence: persistenceHandle,
              stores: resolvedDeps,
            });
          }
        } catch (e) {
          console.error(`[Kernel] Failed to initialize slot "${slot.id}":`, e);
          throw e;
        }

        if (store !== null && store !== undefined) {
          // Register store finalizer if it has a dispose method
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

  // Create runtime
  // deno-lint-ignore no-explicit-any
  const runtime = ManagedRuntime.make(env as Layer.Layer<any, any, never>);

  return {
    runtime,
    resolvedPlugins: resolved,
    sortedSlots: sortedSlots,
  };
}
