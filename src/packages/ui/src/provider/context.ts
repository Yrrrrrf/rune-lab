import type { Kernel, SettingsFieldSchema, Translator } from "rune-lab/core";
import { getContextSymbol, settingsSections } from "rune-lab/core";
import type { Component } from "svelte";
import { getContext } from "svelte";
import { useCell } from "../reactivity/use-cell.svelte.ts";

export const RUNE_LAB_CONTEXT: {
	kernel: symbol;
	app: symbol;
	persistence: symbol;
} = {
	kernel: Symbol("rl:kernel"),
	app: Symbol("rl:app"),
	persistence: Symbol("rl:persistence"),
} as const;

export function getKernel<TCells = Record<string, unknown>>(): Kernel<TCells> {
	const kernel = getContext<Kernel<TCells>>(RUNE_LAB_CONTEXT.kernel);
	if (!kernel) {
		throw new Error(
			"[rune-lab] getKernel() found no Kernel. Did you wrap your application in <RuneProvider>?",
		);
	}
	return kernel;
}

export function createAccessor<T>(
	contextKey: symbol,
	accessorName: string,
	storeName: string,
	pluginName: string,
): () => T {
	return () => {
		const store = getContext<T>(contextKey);
		if (!store) {
			throw new Error(
				`[rune-lab] ${accessorName} found no ${storeName}. Did you register ${pluginName} in <RuneProvider plugins={[…]}>?`,
			);
		}
		return store;
	};
}

export interface SettingsSection {
	id: string;
	label: string;
	icon?: string;
	fields?: SettingsFieldSchema[];
	component?: Component;
	pluginId?: string;
}

/**
 * Reads settings sections from the live contributions cell.
 * MUST be called during component initialization (it calls getContext).
 */
export function getSettingsSections(): SettingsSection[] {
	const kernel = getKernel();
	const contributions = useCell(kernel, "contributions");
	return (contributions.current.get(settingsSections) ??
		[]) as SettingsSection[];
}

const I18N_MESSAGES_KEY = getContextSymbol("rune-lab.i18n", "messages");

const passthroughTranslator: Translator = (_key, fallback) => fallback;

export function getT(): Translator {
	return getContext<Translator>(I18N_MESSAGES_KEY) ?? passthroughTranslator;
}
