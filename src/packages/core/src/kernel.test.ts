import {
	assertEquals,
	assertExists,
	assertRejects,
	assertThrows,
} from "@std/assert";
import { Either, Option, Schema } from "effect";
import { contribute, defineContribution } from "./forge/define-contribution.ts";
import { definePlugin } from "./forge/define-plugin.ts";
import { defineSlot } from "./forge/define-slot.ts";
import { createKernel } from "./kernel/kernel.ts";
import { normalizeSlots, resolveSlotRef } from "./kernel/wiring.ts";
import { createInMemoryDriver } from "./ports/memory.ts";

Deno.test("Kernel - slot resolution and store topological sort initialization", async () => {
	const driver = createInMemoryDriver();

	const pluginA = definePlugin({
		id: "test.pluginA",
		slots: {
			slotA: {
				create: () => "A",
			},
		},
	});

	const pluginB = definePlugin({
		id: "test.pluginB",
		requires: ["test.pluginA"],
		slots: {
			slotB: {
				create: (ctx) => {
					const a = ctx.stores.get("rl:test.pluginA:slotA");
					return `B(${a})`;
				},
				dependsOn: ["test.pluginA.slotA"],
			},
		},
	});

	const kernel = createKernel([pluginB, pluginA], {
		persistence: driver,
	});

	assertExists(kernel);

	const initializedA = kernel.stores.get("rl:test.pluginA:slotA");
	const initializedB = kernel.stores.get("rl:test.pluginB:slotB");

	assertEquals(initializedA, "A");
	assertEquals(initializedB, "B(A)");

	await kernel.dispose();
});

Deno.test("Kernel - resolveSlotRef dotted/bare resolution", () => {
	const slotsResult = normalizeSlots([
		definePlugin({
			id: "pluginA",
			slots: {
				theme: { create: () => "light" },
			},
		}),
		definePlugin({
			id: "pluginB",
			requires: ["pluginA"],
			slots: {
				localSlot: { create: () => "local" },
			},
		}),
	]);
	if (Either.isLeft(slotsResult)) {
		throw new Error(`Expected Right, got Left: ${slotsResult.left.message}`);
	}
	const allSlots = slotsResult.right;

	const slotsMap = new Map(allSlots.map((s) => [s.id, s]));

	// Bare same-plugin ref
	const res1 = resolveSlotRef("localSlot", "pluginB", slotsMap);
	assertEquals(Option.isSome(res1), true);
	if (Option.isSome(res1)) {
		assertEquals(res1.value.id, "rl:pluginB:localSlot");
	}

	// Dotted cross-plugin ref
	const res2 = resolveSlotRef("pluginA.theme", "pluginB", slotsMap);
	assertEquals(Option.isSome(res2), true);
	if (Option.isSome(res2)) {
		assertEquals(res2.value.id, "rl:pluginA:theme");
	}

	// Returns None on missing
	const res3 = resolveSlotRef("pluginA.missing", "pluginB", slotsMap);
	assertEquals(Option.isNone(res3), true);
});

Deno.test("Kernel - contributions and lifecycle", async () => {
	const driver = createInMemoryDriver();

	const commandsKey = defineContribution<{ id: string; label: string }>(
		"commands",
	);

	const plugin = definePlugin({
		id: "test.plugin",
		contributions: [
			contribute(commandsKey, { id: "test-cmd", label: "Test Command" }),
		],
	});

	const kernel = createKernel([plugin], {
		persistence: driver,
	});

	// Verify declarative contributions
	let commands = kernel.getContributions(commandsKey);
	assertEquals(commands.length, 1);
	assertEquals((commands[0] as { id: string }).id, "test-cmd");

	// Verify imperative mutations
	kernel.registerContribution(commandsKey, {
		id: "imp-cmd",
		label: "Imperative",
	});
	commands = kernel.getContributions(commandsKey);
	assertEquals(commands.length, 2);
	assertEquals((commands[1] as { id: string }).id, "imp-cmd");

	kernel.unregisterContribution(commandsKey, "imp-cmd");
	commands = kernel.getContributions(commandsKey);
	assertEquals(commands.length, 1);

	await kernel.dispose();
});

Deno.test("Kernel - Plugin config resolution and isolation", async () => {
	const driver = createInMemoryDriver();

	let receivedA: unknown = "not_set";
	let receivedB: unknown = "not_set";

	const pluginA = definePlugin({
		id: "test.pluginA",
		slots: {
			slotA: {
				config: Schema.Struct({ theme: Schema.String }),
				create: (ctx) => {
					receivedA = ctx.config;
					return "A";
				},
			},
			slotAUnconfigured: {
				create: (ctx) => {
					receivedB = ctx.config;
					return "B";
				},
			},
		},
	});

	const kernel = createKernel([pluginA], {
		persistence: driver,
		pluginConfig: {
			"test.pluginA": {
				slotA: { theme: "dark" },
			},
		},
	});

	assertEquals(receivedA, { theme: "dark" });
	assertEquals(receivedB, undefined);

	await kernel.dispose();
});

Deno.test("Kernel - Config validation failure names plugin and slot", () => {
	const driver = createInMemoryDriver();

	const plugin = definePlugin({
		id: "test.plugin",
		slots: {
			testSlot: {
				config: Schema.Struct({ count: Schema.Number }),
				create: () => "OK",
			},
		},
	});

	assertThrows(
		() => {
			createKernel([plugin], {
				persistence: driver,
				pluginConfig: {
					"test.plugin": {
						testSlot: { count: "not_a_number" },
					},
				},
			});
		},
		Error,
		'Config validation failed for plugin "test.plugin", slot "testSlot"',
	);
});

Deno.test("Kernel - disposal order (slotB before slotA)", async () => {
	const driver = createInMemoryDriver();
	const disposalOrder: string[] = [];

	const pluginA = definePlugin({
		id: "pluginA",
		slots: {
			slotA: defineSlot({
				create: () => ({
					dispose: () => {
						disposalOrder.push("slotA");
					},
				}),
			}),
		},
	});

	const pluginB = definePlugin({
		id: "pluginB",
		requires: ["pluginA"],
		slots: {
			slotB: defineSlot({
				dependsOn: ["pluginA.slotA"],
				create: () => ({
					dispose: () => {
						disposalOrder.push("slotB");
					},
				}),
			}),
		},
	});

	const kernel = createKernel([pluginB, pluginA], { persistence: driver });
	await kernel.dispose();

	assertEquals(disposalOrder, ["slotB", "slotA"]);
});

Deno.test("Kernel - throwing dispose does not prevent sibling dispose", async () => {
	const driver = createInMemoryDriver();
	let siblingDisposed = false;

	const plugin = definePlugin({
		id: "pluginFailing",
		slots: {
			slotFail: defineSlot({
				create: () => ({
					dispose: () => {
						throw new Error("Disposal boom");
					},
				}),
			}),
			slotOK: defineSlot({
				create: () => ({
					dispose: () => {
						siblingDisposed = true;
					},
				}),
			}),
		},
	});

	const kernel = createKernel([plugin], { persistence: driver });
	await assertRejects(async () => {
		await kernel.dispose();
	});

	assertEquals(siblingDisposed, true);
});

Deno.test("Kernel - dispose idempotence", async () => {
	const driver = createInMemoryDriver();
	let disposeCount = 0;

	const plugin = definePlugin({
		id: "pluginIdempotent",
		slots: {
			slot1: defineSlot({
				create: () => ({
					dispose: () => {
						disposeCount++;
					},
				}),
			}),
		},
	});

	const kernel = createKernel([plugin], { persistence: driver });
	await kernel.dispose();
	await kernel.dispose();

	assertEquals(disposeCount, 1);
});

Deno.test("Kernel - non-disposable store skipped silently", async () => {
	const driver = createInMemoryDriver();

	const plugin = definePlugin({
		id: "pluginPlain",
		slots: {
			plainSlot: defineSlot({
				create: () => ({ name: "plain" }),
			}),
		},
	});

	const kernel = createKernel([plugin], { persistence: driver });
	await kernel.dispose();
});
