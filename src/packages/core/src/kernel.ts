import type { PersistenceDriver } from "./ports/persistence.ts";
import type { LocaleAdapter } from "./ports/locale.ts";
import type { TextMeasurer } from "./ports/text.ts";
import type { PluginInput } from "./plugin/manifest.ts";
import { compileEnvironment } from "./compiler.ts";
import { Context, Effect, Option, Schema } from "effect";
import { StateCellsTag } from "./services/layers.ts";
import { getCellSchema } from "./plugin/schemas.ts";

// deno-lint-ignore no-explicit-any
export interface Kernel<TCells = Record<string, any>> {
  stores: Map<string, unknown>;
  overlays: unknown[];

  getCell<K extends keyof TCells>(cellName: K): TCells[K];
  setCell<K extends keyof TCells>(cellName: K, value: TCells[K]): Promise<void>;
  subscribe(cellName: keyof TCells, listener: () => void): () => void;
  getCellVersion(cellName: keyof TCells): number;

  getContributions(key: string): unknown[];
  registerContribution(key: string, item: unknown): void;
  unregisterContribution(key: string, id: string): void;

  getSettingsSections(): unknown[];
  getShortcuts(): unknown[];
  getCommands(): unknown[];

  dispose(): Promise<void>;
}

async function writePersistence(
  persistence: PersistenceDriver,
  name: string,
  value: unknown,
): Promise<void> {
  try {
    const schema = getCellSchema(name, value);
    const encoded = Schema.encodeSync(schema)(value);
    const stringValue = typeof encoded === "string"
      ? encoded
      : JSON.stringify(encoded);
    const res = persistence.set(name, stringValue);
    if (res instanceof Promise) await res;
  } catch (e) {
    console.error(`[Kernel] Persistence write failed for ${name}:`, e);
  }
}

async function updateLocale(
  localeAdapter: LocaleAdapter,
  value: string,
): Promise<void> {
  try {
    const res = localeAdapter.setLocale(value);
    if (res instanceof Promise) await res;
  } catch (e) {
    console.error("[Kernel] Locale adapter setLocale failed:", e);
  }
}

// deno-lint-ignore no-explicit-any
export function createKernel<TCells = Record<string, any>>(
  pluginsInput: PluginInput[],
  options: {
    config: Record<string, unknown>;
    persistence: PersistenceDriver;
    localeAdapter?: LocaleAdapter;
    textMeasurer?: TextMeasurer;
  },
): Kernel<TCells> {
  const { runtime, resolvedPlugins, sortedEntries } = compileEnvironment(
    pluginsInput,
    options,
  );

  const ctx = runtime.runSync(Effect.context());

  // Extract stores
  const stores = new Map<string, unknown>();
  for (const entry of sortedEntries) {
    const storeTag = Context.GenericTag<unknown>(entry.id);
    const opt = Context.getOption(ctx, storeTag);
    if (Option.isSome(opt) && opt.value !== null && opt.value !== undefined) {
      stores.set(entry.id, opt.value);
    }
  }

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

  // Extract cells
  const cellsService = Context.get(ctx, StateCellsTag);
  const cells = cellsService.cells;

  // Populate declarative contributions into contributions cell
  const initialContributions: Record<string, unknown[]> = {};
  const overlays: unknown[] = [];

  for (const plugin of resolvedPlugins) {
    if (plugin.contributions) {
      for (const [key, items] of Object.entries(plugin.contributions)) {
        if (!initialContributions[key]) {
          initialContributions[key] = [];
        }
        initialContributions[key].push(...items);
      }
    }
    if (plugin.overlays) {
      overlays.push(...plugin.overlays);
    }
  }

  cells.contributions.set(initialContributions);

  const getCell = <K extends keyof TCells>(cellName: K): TCells[K] => {
    const cell = cells[cellName as string];
    if (!cell) {
      throw new Error(`[Kernel] Cell "${cellName as string}" does not exist`);
    }
    return cell.get() as TCells[K];
  };

  const setCell = async <K extends keyof TCells>(
    cellName: K,
    value: TCells[K],
  ): Promise<void> => {
    const nameStr = cellName as string;
    const cell = cells[nameStr];
    if (!cell) {
      throw new Error(`[Kernel] Cell "${nameStr}" does not exist`);
    }
    cell.set(value);

    const isStandardPersistenceKey = nameStr === "theme" ||
      nameStr === "language" || nameStr === "currency";

    if (isStandardPersistenceKey) {
      await writePersistence(options.persistence, nameStr, value);
    }

    if (nameStr === "language" && options.localeAdapter) {
      await updateLocale(options.localeAdapter, value as string);
    }
  };

  const getContributions = (key: string): unknown[] => {
    const registry = getCell(
      "contributions" as unknown as keyof TCells,
    ) as Record<string, unknown[]>;
    return registry[key] ?? [];
  };

  const registerContribution = (key: string, item: unknown): void => {
    const registry = {
      ...(getCell("contributions" as unknown as keyof TCells) as Record<
        string,
        unknown[]
      >),
    };
    const list = registry[key] ? [...registry[key]] : [];
    list.push(item);
    registry[key] = list;
    cells.contributions.set(registry);
  };

  const unregisterContribution = (key: string, id: string): void => {
    const registry = {
      ...(getCell("contributions" as unknown as keyof TCells) as Record<
        string,
        unknown[]
      >),
    };
    if (registry[key]) {
      registry[key] = registry[key].filter((item) => {
        const obj = item as Record<string, unknown>;
        return !obj || obj.id !== id;
      });
      cells.contributions.set(registry);
    }
  };

  return {
    stores,
    overlays,
    getCell,
    setCell,
    getContributions,
    registerContribution,
    unregisterContribution,

    getSettingsSections: () => getContributions("settingsSections"),
    getShortcuts: () => getContributions("shortcuts"),
    getCommands: () => getContributions("commands"),

    subscribe: (cellName: keyof TCells, listener: () => void) => {
      const cell = cells[cellName as string];
      if (!cell) {
        throw new Error(`[Kernel] Cell "${cellName as string}" does not exist`);
      }
      return cell.subscribe(listener);
    },

    getCellVersion: (cellName: keyof TCells) => {
      const cell = cells[cellName as string];
      if (!cell) {
        throw new Error(`[Kernel] Cell "${cellName as string}" does not exist`);
      }
      return cell.getVersion();
    },

    dispose: async () => {
      await runtime.dispose();
    },
  };
}
