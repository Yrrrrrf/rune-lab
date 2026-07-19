import { Context, Effect, Option } from "effect";
import type { StateCell } from "../cells/define-cell.ts";
import type { ForgedPlugin, PluginInput } from "../forge/define-plugin.ts";

import type { LocaleAdapter } from "../ports/locale.ts";
import type { PersistenceDriver } from "../ports/persistence.ts";
import type { TextMeasurer } from "../ports/text.ts";
import { StateCellsTag } from "../services/layers.ts";
import { compileEnvironment, type NormalizedSlot } from "./wiring.ts";

export interface Kernel<TCells = Record<string, unknown>> {
  stores: Map<string, unknown>;
  overlays: unknown[];

  getCell<K extends keyof TCells>(cellName: K): TCells[K];
  setCell<K extends keyof TCells>(cellName: K, value: TCells[K]): Promise<void>;
  subscribe(cellName: keyof TCells, listener: () => void): () => void;
  getCellVersion(cellName: keyof TCells): number;

  getContributions(key: string): unknown[];
  registerContribution(key: string, item: unknown): void;
  unregisterContribution(key: string, id: string): void;

  getStoreEntry(
    id: string,
  ): { contextKey?: symbol; expose?: boolean } | undefined;

  dispose(): Promise<void>;
}

export function createKernel<TCells = Record<string, unknown>>(
  pluginsInput: PluginInput[],
  options: {
    config: Record<string, unknown>;
    persistence: PersistenceDriver;
    localeAdapter?: LocaleAdapter;
    textMeasurer?: TextMeasurer;
  },
): Kernel<TCells> {
  const { runtime, resolvedPlugins, sortedSlots } = compileEnvironment(
    pluginsInput,
    options,
  );

  const ctx = runtime.runSync(Effect.context());
  const cellsService = Context.get(ctx, StateCellsTag);
  const cells = cellsService.cells;

  const stores = extractStores(ctx, sortedSlots);
  const overlays = extractOverlays(resolvedPlugins);
  const initialContributions = extractInitialContributions(resolvedPlugins);

  // Auto-register declarative contributions to matching stores
  for (const plugin of resolvedPlugins) {
    if (plugin.contributions) {
      for (const [key, items] of Object.entries(plugin.contributions)) {
        const store = stores.get(key) as
          | { register(item: unknown): void }
          | undefined;
        if (store && typeof store.register === "function") {
          items.forEach((item) => store.register(item));
        }
      }
    }
  }

  cells.contributions.set(initialContributions);

  const slotMap = new Map(sortedSlots.map((s) => [s.id, s]));

  function getCell(cellName: string): StateCell<unknown> {
    if (cellName === "contributions") {
      return cells.contributions;
    }
    let storeKey = cellName;
    if (!cellName.startsWith("rl:")) {
      if (cellName.includes(".")) {
        const lastDot = cellName.lastIndexOf(".");
        const pluginId = cellName.slice(0, lastDot);
        const slotName = cellName.slice(lastDot + 1);
        storeKey = `rl:${pluginId}:${slotName}`;
      }
    }
    const store = stores.get(storeKey);
    if (!store) {
      throw new Error(`[Kernel] Cell "${cellName}" does not exist`);
    }
    return store as StateCell<unknown>;
  }

  return {
    stores,
    overlays,
    getCell: (cellName) => {
      const cell = getCell(cellName as string);
      return cell.get() as TCells[typeof cellName];
    },
    setCell: async (cellName, value) => {
      const cell = getCell(cellName as string);
      await cell.set(value as unknown);
    },
    subscribe: (cellName, listener) => {
      const cell = getCell(cellName as string);
      return cell.subscribe(listener);
    },
    getCellVersion: (cellName) => {
      const cell = getCell(cellName as string);
      return cell.getVersion();
    },
    getContributions: (key) => {
      const registry = cells.contributions.get() as Record<string, unknown[]>;
      return registry[key] ?? [];
    },
    registerContribution: (key, item) =>
      registerContributionLifecycle(cells, key, item),
    unregisterContribution: (key, id) =>
      unregisterContributionLifecycle(cells, key, id),
    getStoreEntry: (id) => slotMap.get(id),
    dispose: () => runtime.dispose(),
  };
}

function extractStores(
  ctx: Context.Context<never>,
  slots: NormalizedSlot[],
): Map<string, unknown> {
  const stores = new Map<string, unknown>();
  for (const slot of slots) {
    const storeTag = Context.GenericTag<unknown>(slot.id);
    const opt = Context.getOption(ctx, storeTag);
    if (Option.isSome(opt) && opt.value !== null && opt.value !== undefined) {
      stores.set(slot.id, opt.value);
    }
  }
  return stores;
}

function extractOverlays(plugins: ForgedPlugin[]): unknown[] {
  const overlays: unknown[] = [];
  for (const plugin of plugins) {
    if (plugin.overlays) {
      overlays.push(...plugin.overlays);
    }
  }
  return overlays;
}

function extractInitialContributions(
  plugins: ForgedPlugin[],
): Record<string, unknown[]> {
  const contributions: Record<string, unknown[]> = {};
  for (const plugin of plugins) {
    if (plugin.contributions) {
      for (const [key, items] of Object.entries(plugin.contributions)) {
        if (!contributions[key]) contributions[key] = [];
        contributions[key].push(...(items as unknown[]));
      }
    }
    // Automatically register settings schemas as contributions to "settingsSections"
    if (plugin.settings) {
      if (!contributions["settingsSections"]) {
        contributions["settingsSections"] = [];
      }
      contributions["settingsSections"].push(plugin.settings);
    }
  }
  return contributions;
}

function registerContributionLifecycle(
  cells: Record<string, StateCell<unknown>>,
  key: string,
  item: unknown,
): void {
  const contributionsCell = cells.contributions;
  if (!contributionsCell) return;
  const registry = {
    ...(contributionsCell.get() as Record<string, unknown[]>),
  };
  const list = registry[key] ? [...registry[key]] : [];
  list.push(item);
  registry[key] = list;
  contributionsCell.set(registry);
}

function unregisterContributionLifecycle(
  cells: Record<string, StateCell<unknown>>,
  key: string,
  id: string,
): void {
  const contributionsCell = cells.contributions;
  if (!contributionsCell) return;
  const registry = {
    ...(contributionsCell.get() as Record<string, unknown[]>),
  };
  if (registry[key]) {
    registry[key] = registry[key].filter((item) => {
      const obj = item as Record<string, unknown>;
      return !obj || obj.id !== id;
    });
    contributionsCell.set(registry);
  }
}
