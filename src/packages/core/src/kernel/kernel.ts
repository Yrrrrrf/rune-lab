import { Context, Effect, Option } from "effect";
import type { StateCell } from "../cells/define-cell.ts";
import {
  type ContributionKey,
  settingsSections,
} from "../forge/define-contribution.ts";
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

  getContributions<T>(key: ContributionKey<T>): T[];
  registerContribution<T>(key: ContributionKey<T>, item: T): void;
  unregisterContribution<T>(key: ContributionKey<T>, id: string): void;
  registerStore<T>(
    key: ContributionKey<T>,
    store: { register(item: T): void },
  ): void;

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

  const registeredStores = new Map<
    ContributionKey<unknown>,
    { register(item: unknown): void }
  >();

  // Auto-register declarative contributions to matching stores by string ID matching (fallback)
  for (const plugin of resolvedPlugins) {
    if (plugin.contributions) {
      for (const entry of plugin.contributions) {
        const store = stores.get(entry.key.id) as
          | { register(item: unknown): void }
          | undefined;
        if (store && typeof store.register === "function") {
          entry.items.forEach((item) => store.register(item));
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
    getContributions: <T>(key: ContributionKey<T>): T[] => {
      const registry = cells.contributions.get() as Map<
        ContributionKey<unknown>,
        unknown[]
      >;
      return (registry.get(key) ?? []) as T[];
    },
    registerContribution: <T>(key: ContributionKey<T>, item: T) => {
      registerContributionLifecycle(cells, key, item);
      const store = registeredStores.get(key);
      if (store) {
        store.register(item);
      }
    },
    unregisterContribution: <T>(key: ContributionKey<T>, id: string) =>
      unregisterContributionLifecycle(cells, key, id),
    registerStore: <T>(
      key: ContributionKey<T>,
      store: { register(item: T): void },
    ) => {
      registeredStores.set(key, store as { register(item: unknown): void });
      const items = (
        cells.contributions.get() as Map<ContributionKey<unknown>, unknown[]>
      ).get(key) ?? [];
      items.forEach((item) => store.register(item as T));
    },
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
): Map<ContributionKey<unknown>, unknown[]> {
  const contributions = new Map<ContributionKey<unknown>, unknown[]>();
  for (const plugin of plugins) {
    if (plugin.contributions) {
      for (const entry of plugin.contributions) {
        if (!contributions.has(entry.key)) {
          contributions.set(entry.key, []);
        }
        contributions.get(entry.key)?.push(...entry.items);
      }
    }
    // Automatically register settings schemas as contributions to "settingsSections"
    if (plugin.settings) {
      if (!contributions.has(settingsSections)) {
        contributions.set(settingsSections, []);
      }
      contributions.get(settingsSections)?.push(plugin.settings);
    }
  }
  return contributions;
}

function registerContributionLifecycle<T>(
  cells: Record<string, StateCell<unknown>>,
  key: ContributionKey<T>,
  item: T,
): void {
  const contributionsCell = cells.contributions as StateCell<
    Map<ContributionKey<unknown>, unknown[]>
  >;
  if (!contributionsCell) return;
  const registry = new Map(contributionsCell.get());
  const list = registry.get(key) ? [...registry.get(key)!] : [];
  list.push(item);
  registry.set(key, list);
  contributionsCell.set(registry);
}

function unregisterContributionLifecycle<T>(
  cells: Record<string, StateCell<unknown>>,
  key: ContributionKey<T>,
  id: string,
): void {
  const contributionsCell = cells.contributions as StateCell<
    Map<ContributionKey<unknown>, unknown[]>
  >;
  if (!contributionsCell) return;
  const registry = new Map(contributionsCell.get());
  const list = registry.get(key);
  if (list) {
    const filtered = list.filter((item: unknown) => {
      const obj = item as Record<string, unknown>;
      return !obj || obj.id !== id;
    });
    registry.set(key, filtered);
    contributionsCell.set(registry);
  }
}
