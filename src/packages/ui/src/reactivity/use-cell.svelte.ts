import { BROWSER } from "esm-env";
import type { ContributionKey, Kernel } from "rune-lab/core";
import { createSubscriber } from "svelte/reactivity";
import { getKernel } from "../provider/context.ts";

export type ContributionsMap = Map<ContributionKey<unknown>, unknown[]>;

export function useCell(cellName?: "contributions"): {
	readonly current: ContributionsMap;
};
export function useCell(
	kernel: Kernel,
	cellName?: "contributions",
): { readonly current: ContributionsMap };
export function useCell(
	first?: Kernel | "contributions",
	second?: "contributions",
): { readonly current: ContributionsMap } {
	let kernel: Kernel;
	let cellName = "contributions" as const;

	if (typeof first === "object" && first !== null) {
		kernel = first;
		if (second) cellName = second;
	} else {
		kernel = getKernel();
		if (typeof first === "string") cellName = first;
	}

	const subscribe = createSubscriber((update) => {
		return kernel.subscribe(cellName, update);
	});

	return {
		get current(): ContributionsMap {
			if (BROWSER) {
				subscribe();
			}
			return kernel.getCell("contributions") as ContributionsMap;
		},
	};
}
