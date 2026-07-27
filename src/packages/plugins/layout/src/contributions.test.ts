import {
	createInMemoryDriver,
	createKernel,
	definePlugin,
} from "rune-lab/core";
import { useCell } from "rune-lab/ui";
import { describe, expect, it } from "vite-plus/test";
import { statusbar, type StatusbarItem } from "./contributions.ts";

describe("statusbar contributions reactivity (W2-F)", () => {
	it("reflects a runtime registerContribution without a remount", async () => {
		const driver = createInMemoryDriver();
		const testPlugin = definePlugin({ id: "test" });
		const kernel = createKernel([testPlugin], { persistence: driver });

		const contributions = useCell(kernel, "contributions");
		expect(contributions.current.get(statusbar) ?? []).toEqual([]);

		const item: StatusbarItem = { id: "clock", label: "12:00" };
		kernel.registerContribution(statusbar, item);

		expect(contributions.current.get(statusbar)).toEqual([item]);

		await kernel.dispose();
	});

	it("reflects a runtime unregisterContribution without a remount", async () => {
		const driver = createInMemoryDriver();
		const testPlugin = definePlugin({ id: "test" });
		const kernel = createKernel([testPlugin], { persistence: driver });

		const contributions = useCell(kernel, "contributions");
		const item: StatusbarItem = { id: "clock", label: "12:00" };
		kernel.registerContribution(statusbar, item);
		expect(contributions.current.get(statusbar)).toEqual([item]);

		kernel.unregisterContribution(statusbar, "clock");
		expect(contributions.current.get(statusbar)).toEqual([]);

		await kernel.dispose();
	});
});
