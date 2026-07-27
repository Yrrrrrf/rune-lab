import {
	createInMemoryDriver,
	createKernel,
	type TextMeasurer,
} from "rune-lab/core";
import { expect, it } from "vite-plus/test";
import { layout } from "../plugin.ts";
import type { TextStoreFacade } from "../stores/text.svelte.ts";

class CustomTextMeasurer implements TextMeasurer {
	prepare(text: string, font: string): unknown {
		return { text, font };
	}
	layout(prepared: unknown, _maxWidth: number, _lineHeight: number): unknown {
		return prepared;
	}
}

it("kernel test injecting custom TextMeasurer reaches TextStoreFacade", async () => {
	const driver = createInMemoryDriver();
	const customMeasurer = new CustomTextMeasurer();

	const kernel = createKernel([layout], {
		persistence: driver,
		textMeasurer: customMeasurer,
	});

	const textStore = kernel.stores.get(
		"rl:rune-lab.layout:text",
	) as TextStoreFacade;
	expect(textStore).toBeDefined();
	expect(textStore.ready).toBe(true);

	await kernel.dispose();
});
