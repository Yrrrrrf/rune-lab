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
import { type StateCells, StateCellsTag } from "../services/layers.ts";
import { compileEnvironment, type NormalizedSlot } from "./wiring.ts";

export interface Kernel<TCells = Record<string, unknown>> {
  stores: Map<string, unknown>;
  overlays: unknown[];

  getCell<K extends keyof TCells>(cellName: K): TCells[K];
  subscribe(cellName: keyof TCells, listener: () => void): () => void;

  getContributions<T>(key: ContributionKey<T>): T[];
  registerContribution<T>(key: ContributionKey<T>, item: T): void;
  unregisterContribution<T>(key: ContributionKey<T>, id: string): void;

  getStoreEntry(
    id: string,
  ): { contextKey?: symbol; expose?: boolean } | undefined;

  dispose(): Promise<void>;
}

export function createKernel<TCells = Record<string, unknown>>(
  pluginsInput: PluginInput[],
  options: {
    persistence: PersistenceDriver;
    localeAdapter?: LocaleAdapter;
    textMeasurer?: TextMeasurer;
    pluginConfig?: Record<string, Record<string, unknown>>;
  },
): Kernel<TCells> {
  let compiled;
  try {
    compiled = compileEnvironment(pluginsInput, options);
  } catch (err: unknown) {
    if (
      err && typeof err === "object" && "message" in err &&
      typeof (err as { message: unknown }).message === "string"
    ) {
      throw new Error((err as { message: string }).message);
    }
    throw err;
  }
  const { runtime, resolvedPlugins, sortedSlots } = compiled;

  let ctx: Context.Context<never>;
  try {
    ctx = runtime.runSync(Effect.context());
  } catch (err: unknown) {
    if (err && typeof err === "object") {
      const e = err as Record<string, unknown>;
      if ("_tag" in e && e._tag === "FiberFailure" && "cause" in e) {
        const cause = e.cause as Record<string, unknown> | undefined;
        if (cause && "error" in cause) {
          const errorObj = cause.error as Record<string, unknown> | undefined;
          if (
            errorObj && "message" in errorObj &&
            typeof errorObj.message === "string"
          ) {
            throw new Error(errorObj.message);
          }
        }
      }
      if ("message" in e && typeof e.message === "string") {
        throw new Error(e.message);
      }
    }
    throw err;
  }
  const cellsService = Context.get(
    ctx,
    StateCellsTag as unknown as Context.Tag<never, StateCells>,
  );
  const cells = cellsService.cells;

  const stores = extractStores(ctx, sortedSlots);
  const overlays = extractOverlays(resolvedPlugins);
  const initialContributions = extractInitialContributions(resolvedPlugins);

  cells.contributions.set(initialContributions);

  const slotMap = new Map(sortedSlots.map((s) => [s.id, s]));

  function getCell(cellName: string): StateCell<unknown> {
    if (cellName !== "contributions") {
      throw new Error(`[rune-lab] Unknown cell "${cellName}"`);
    }
    return cells.contributions;
  }

  let disposed = false;
  let disposePromise: Promise<void> | null = null;

  return {
    stores,
    overlays,
    getCell: (cellName) => {
      const cell = getCell(cellName as string);
      return cell.get() as TCells[typeof cellName];
    },
    subscribe: (cellName, listener) => {
      const cell = getCell(cellName as string);
      return cell.subscribe(listener);
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
    },
    unregisterContribution: <T>(key: ContributionKey<T>, id: string) =>
      unregisterContributionLifecycle(cells, key, id),
    getStoreEntry: (id) => slotMap.get(id),
    dispose: () => {
      if (disposed) return Promise.resolve();
      if (disposePromise) return disposePromise;
      disposePromise = (async () => {
        try {
          await runtime.dispose();
        } catch (err: unknown) {
          disposed = true;
          const errors: unknown[] = [];
          if (err && typeof err === "object") {
            const e = err as Record<string, unknown>;
            if ("_tag" in e && e._tag === "FiberFailure" && "cause" in e) {
              const cause = e.cause as Record<string, unknown> | undefined;
              if (
                cause && "failures" in cause && Array.isArray(cause.failures)
              ) {
                errors.push(...cause.failures);
              } else if (cause && "error" in cause) {
                errors.push(cause.error);
              }
            } else {
              errors.push(err);
            }
          } else {
            errors.push(err);
          }
          throw new AggregateError(errors, "Kernel disposal failed");
        } finally {
          disposed = true;
        }
      })();
      return disposePromise;
    },
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
