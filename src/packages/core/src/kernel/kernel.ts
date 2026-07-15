// deno-lint-ignore-file no-explicit-any
import { Context, Effect, Option, Schema } from "effect";
import type { RuneLabCells } from "../cells/cells.ts";
import { getCellSchema } from "../cells/schemas.ts";
import type { PluginInput } from "../forge/define-plugin.ts";
import type { LocaleAdapter } from "../ports/locale.ts";
import type { PersistenceDriver } from "../ports/persistence.ts";
import type { TextMeasurer } from "../ports/text.ts";
import { StateCellsTag } from "../services/layers.ts";
import {
  registerContributionLifecycle,
  setCellLifecycle,
  unregisterContributionLifecycle,
} from "./lifecycle.ts";
import { compileEnvironment, type NormalizedSlot } from "./wiring.ts";

export interface Kernel<TCells = RuneLabCells> {
  stores: Map<string, unknown>;
  overlays: unknown[];

  getCell<K extends keyof TCells>(cellName: K): TCells[K];
  setCell<K extends keyof TCells>(cellName: K, value: TCells[K]): Promise<void>;
  subscribe(cellName: keyof TCells, listener: () => void): () => void;
  getCellVersion(cellName: keyof TCells): number;

  getContributions(key: string): unknown[];
  registerContribution(key: string, item: unknown): void;
  unregisterContribution(key: string, id: string): void;

  getStoreEntry(id: string): any;

  dispose(): Promise<void>;
}

export function createKernel<TCells = RuneLabCells>(
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

  // Initialize synchronizers
  if (options.persistence) {
    loadPersistedCells(cells, options.persistence);
  }
  if (options.localeAdapter) {
    bindLocaleAdapter(cells, options.localeAdapter);
  }

  const slotMap = new Map(sortedSlots.map((s) => [s.id, s]));

  return {
    stores,
    overlays,
    getCell: (cellName) => {
      const cell = cells[cellName as string];
      if (!cell) {
        throw new Error(`[Kernel] Cell "${cellName as string}" does not exist`);
      }
      return cell.get() as any;
    },
    setCell: (cellName, value) =>
      setCellLifecycle(
        cells,
        cellName,
        value,
        options.persistence,
        options.localeAdapter,
      ),
    subscribe: (cellName, listener) => {
      const cell = cells[cellName as string];
      if (!cell) {
        throw new Error(`[Kernel] Cell "${cellName as string}" does not exist`);
      }
      return cell.subscribe(listener);
    },
    getCellVersion: (cellName) => {
      const cell = cells[cellName as string];
      if (!cell) {
        throw new Error(`[Kernel] Cell "${cellName as string}" does not exist`);
      }
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

function extractOverlays(plugins: any[]): unknown[] {
  const overlays: unknown[] = [];
  for (const plugin of plugins) {
    if (plugin.overlays) {
      overlays.push(...plugin.overlays);
    }
  }
  return overlays;
}

function extractInitialContributions(
  plugins: any[],
): Record<string, unknown[]> {
  const contributions: Record<string, unknown[]> = {};
  for (const plugin of plugins) {
    if (plugin.contributions) {
      for (const [key, items] of Object.entries(plugin.contributions)) {
        if (!contributions[key]) contributions[key] = [];
        contributions[key].push(...(items as any[]));
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

function loadPersistedCells(
  cells: Record<string, any>,
  persistence: PersistenceDriver,
): void {
  const keys = ["theme", "language", "currency"];
  for (const key of keys) {
    const saved = persistence.get(key);
    const applyValue = (val: string | null) => {
      if (val !== null && val !== undefined) {
        const schema = getCellSchema(key, cells[key].get());
        try {
          const decoded = Schema.decodeUnknownSync(schema)(val);
          cells[key].set(decoded);
        } catch {
          // ignore parsing error
        }
      }
    };
    if (saved instanceof Promise) {
      saved.then(applyValue).catch(() => {
        // ignore rejection
      });
    } else {
      applyValue(saved);
    }
  }
}

function bindLocaleAdapter(
  cells: Record<string, any>,
  adapter: LocaleAdapter,
): void {
  const initial = adapter.getLocale();
  if (initial) {
    cells.language.set(initial);
  }
  adapter.onChange((lang) => {
    const current = cells.language.get();
    if (current !== lang) {
      cells.language.set(lang);
    }
  });
}
