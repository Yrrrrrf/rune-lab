import { assertEquals, assertThrows } from "@std/assert";
import { Schema } from "effect";
import {
	CircularPluginDependency,
	CircularSlotDependency,
	MissingRequirement,
	SlotConfigInvalid,
	SlotInitFailed,
	UndeclaredCrossPluginDependency,
	UnresolvableSlotRef,
} from "./errors.ts";
import { definePlugin } from "./forge/define-plugin.ts";
import { defineSlot } from "./forge/define-slot.ts";
import { createKernel } from "./kernel/kernel.ts";
import { createInMemoryDriver } from "./ports/memory.ts";

Deno.test("Errors - missing requirement tag", () => {
	const err = new MissingRequirement({
		pluginId: "pluginB",
		requiredId: "pluginA",
	});
	assertEquals(err._tag, "MissingRequirement");

	const driver = createInMemoryDriver();
	const pluginB = definePlugin({ id: "pluginB", requires: ["pluginA"] });
	assertThrows(
		() => createKernel([pluginB], { persistence: driver }),
		Error,
		'Plugin "pluginB" requires "pluginA"',
	);
});

Deno.test("Errors - circular plugin dependency tag", () => {
	const err = new CircularPluginDependency({
		cycle: ["pluginA", "pluginB", "pluginA"],
	});
	assertEquals(err._tag, "CircularPluginDependency");

	const driver = createInMemoryDriver();
	const pluginA = definePlugin({ id: "pluginA", requires: ["pluginB"] });
	const pluginB = definePlugin({ id: "pluginB", requires: ["pluginA"] });
	assertThrows(
		() => createKernel([pluginA, pluginB], { persistence: driver }),
		Error,
		"Circular dependency detected in plugins",
	);
});

Deno.test("Errors - circular slot dependency tag", () => {
	const err = new CircularSlotDependency({
		cycle: ["rl:pluginA:slot1", "rl:pluginA:slot2"],
	});
	assertEquals(err._tag, "CircularSlotDependency");

	const pluginA = definePlugin({
		id: "pluginA",
		slots: {
			slot1: { create: () => "1", dependsOn: ["pluginA.slot2"] },
			slot2: { create: () => "2", dependsOn: ["pluginA.slot1"] },
		},
	});
	const driver = createInMemoryDriver();
	assertThrows(
		() => createKernel([pluginA], { persistence: driver }),
		Error,
		"Circular dependency detected in slots",
	);
});

Deno.test("Errors - unresolvable slot ref tag", () => {
	const err = new UnresolvableSlotRef({
		ref: "nonexistent",
		declaringPluginId: "pluginA",
	});
	assertEquals(err._tag, "UnresolvableSlotRef");

	const pluginA = definePlugin({
		id: "pluginA",
		slots: {
			slot1: defineSlot({
				create: () => "1",
				dependsOn: ["pluginA.nonexistent"],
			}),
		},
	});
	const driver = createInMemoryDriver();
	assertThrows(
		() => createKernel([pluginA], { persistence: driver }),
		Error,
		"Cannot resolve slot reference",
	);
});

Deno.test("Errors - undeclared cross-plugin dependency tag", () => {
	const err = new UndeclaredCrossPluginDependency({
		slotName: "slotB",
		pluginId: "pluginB",
		dep: "pluginA.slotA",
		targetPluginId: "pluginA",
	});
	assertEquals(err._tag, "UndeclaredCrossPluginDependency");

	const pluginA = definePlugin({
		id: "pluginA",
		slots: { slotA: { create: () => "A" } },
	});
	const pluginB = definePlugin({
		id: "pluginB",
		// requires: ["pluginA"] is missing!
		slots: {
			slotB: { create: () => "B", dependsOn: ["pluginA.slotA"] },
		},
	});
	const driver = createInMemoryDriver();
	assertThrows(
		() => createKernel([pluginA, pluginB], { persistence: driver }),
		Error,
		'is not in the requires spec of "pluginB"',
	);
});

Deno.test("Errors - slot config invalid tag", () => {
	const err = new SlotConfigInvalid({
		pluginId: "pluginA",
		slotName: "slotA",
		parseError: "Expected number",
	});
	assertEquals(err._tag, "SlotConfigInvalid");

	const pluginA = definePlugin({
		id: "pluginA",
		slots: {
			slotA: {
				config: Schema.Struct({ count: Schema.Number }),
				create: () => "A",
			},
		},
	});
	const driver = createInMemoryDriver();
	assertThrows(
		() =>
			createKernel([pluginA], {
				persistence: driver,
				pluginConfig: {
					pluginA: { slotA: { count: "invalid" } },
				},
			}),
		Error,
		'Config validation failed for plugin "pluginA", slot "slotA"',
	);
});

Deno.test("Errors - slot init failed tag", () => {
	const err = new SlotInitFailed({
		slotId: "rl:pluginA:slotA",
		cause: new Error("Init exploded"),
	});
	assertEquals(err._tag, "SlotInitFailed");

	const pluginA = definePlugin({
		id: "pluginA",
		slots: {
			slotA: {
				create: () => {
					throw new Error("Init exploded");
				},
			},
		},
	});
	const driver = createInMemoryDriver();
	assertThrows(
		() => createKernel([pluginA], { persistence: driver }),
		Error,
		'Failed to initialize slot "rl:pluginA:slotA"',
	);
});
