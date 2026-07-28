import { Cause, Chunk, Context, Effect, Either, Exit, Option } from "effect";
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
	const compiled = compileEnvironment(pluginsInput, options);
	if (Either.isLeft(compiled)) {
		throw new Error(compiled.left.message);
	}
	const { runtime, resolvedPlugins, sortedSlots } = compiled.right;

	const ctxExit = runtime.runSyncExit(Effect.context());
	if (Exit.isFailure(ctxExit)) {
		const typedFailure = Cause.failureOption(ctxExit.cause);
		if (Option.isSome(typedFailure)) {
			throw new Error((typedFailure.value as { message: string }).message);
		}
		throw Cause.squash(ctxExit.cause);
	}
	const ctx = ctxExit.value;
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
			// Effect.addFinalizer requires its callback's error channel to be
			// `never` (see the Effect type: `(exit) => Effect<X, never, R>`), so a
			// failing finalizer can only ever surface as a defect, not a typed
			// failure. `runPromiseExit` captures that defect into the Exit instead
			// of rejecting, and `Cause.defects` walks the whole cause tree
			// (parallel or sequential) to collect every one of them.
			disposePromise = Effect.runPromiseExit(runtime.disposeEffect).then(
				(exit) => {
					disposed = true;
					if (Exit.isFailure(exit)) {
						throw new AggregateError(
							Chunk.toArray(Cause.defects(exit.cause)),
							"Kernel disposal failed",
						);
					}
				},
			);
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
			contributions.get(settingsSections)?.push({
				...plugin.settings,
				pluginId: plugin.id,
			});
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
