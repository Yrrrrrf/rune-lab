import type { Component } from "svelte";
import type { StoreFactory } from "./types.ts";
import { registerStore } from "./index.ts";

/**
 * A slot for a single store within a RunePlugin.
 */
export interface StoreSlot {
  /** slot id, used as key in STORE_REGISTRY and stores Map */
  id: string;
  /** from RUNE_LAB_CONTEXT or consumer-defined symbol */
  contextKey: symbol;
  /** existing type: (config, driver, stores) => Store | null */
  factory: StoreFactory;
  /** null return from factory means skip, not error */
  optional?: boolean;
  /** other slot ids that must initialize first */
  dependsOn?: string[];
  /** skip persistence driver injection for this slot */
  noPersistence?: boolean;
}

/**
 * A RunePlugin is a collection of stores and overlays.
 */
export interface RunePlugin {
  /** dot-namespaced: "rune-lab.layout" */
  id: string;
  /** one or more store slots */
  stores: StoreSlot[];
  /** Svelte components, no required props */
  overlays?: Component<Record<never, never>>[];
}

/**
 * Define a Rune plugin and register its stores.
 */
export function defineRune(plugin: RunePlugin): RunePlugin {
  for (const slot of plugin.stores) {
    registerStore({
      key: slot.id,
      contextKey: slot.contextKey,
      pluginId: plugin.id,
      factory: slot.factory,
      optional: slot.optional,
      dependsOn: slot.dependsOn,
      noPersistence: slot.noPersistence,
    });
  }
  return plugin;
}
