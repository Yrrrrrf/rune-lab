import { assertEquals } from "@std/assert";
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
import { defineSlot } from "./forge/define-slot.ts";
import { definePlugin } from "./forge/define-plugin.ts";
import { createKernel } from "./kernel/kernel.ts";
import { createInMemoryDriver } from "./ports/memory.ts";

Deno.test("Errors - missing requirement tag", () => {
  const driver = createInMemoryDriver();
  const pluginB = definePlugin({
    id: "pluginB",
    requires: ["pluginA"],
  });
  try {
    createKernel([pluginB], { persistence: driver });
  } catch (err: unknown) {
    // Check that string error carries message, or TaggedError directly
    if (err instanceof Error) {
      assertEquals(
        err.message.includes(
          'Missing requirement: Plugin "pluginB" requires "pluginA"',
        ),
        true,
      );
    }
  }
  const err = new MissingRequirement({
    pluginId: "pluginB",
    requiredId: "pluginA",
  });
  assertEquals(err._tag, "MissingRequirement");
});

Deno.test("Errors - circular plugin dependency tag", () => {
  const driver = createInMemoryDriver();
  const pluginA = definePlugin({ id: "pluginA", requires: ["pluginB"] });
  const pluginB = definePlugin({ id: "pluginB", requires: ["pluginA"] });
  try {
    createKernel([pluginA, pluginB], { persistence: driver });
  } catch (err: unknown) {
    if (err instanceof Error) {
      assertEquals(
        err.message.includes("Circular dependency detected in plugins"),
        true,
      );
    }
  }
  const err = new CircularPluginDependency({
    cycle: ["pluginA", "pluginB", "pluginA"],
  });
  assertEquals(err._tag, "CircularPluginDependency");
});

Deno.test("Errors - circular slot dependency tag", () => {
  const pluginA = definePlugin({
    id: "pluginA",
    slots: {
      slot1: { create: () => "1", dependsOn: ["pluginA.slot2"] },
      slot2: { create: () => "2", dependsOn: ["pluginA.slot1"] },
    },
  });
  const driver = createInMemoryDriver();
  try {
    createKernel([pluginA], { persistence: driver });
  } catch (err: unknown) {
    if (err instanceof Error) {
      assertEquals(
        err.message.includes("Circular dependency detected in slots"),
        true,
      );
    }
  }
  const err = new CircularSlotDependency({
    cycle: ["rl:pluginA:slot1", "rl:pluginA:slot2"],
  });
  assertEquals(err._tag, "CircularSlotDependency");
});

Deno.test("Errors - unresolvable slot ref tag", () => {
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
  let caught = false;
  try {
    createKernel([pluginA], { persistence: driver });
  } catch (err: unknown) {
    caught = true;
    if (err instanceof Error) {
      assertEquals(err.message.includes("Cannot resolve slot reference"), true);
    }
  }
  assertEquals(caught, true);
  const err = new UnresolvableSlotRef({
    ref: "nonexistent",
    declaringPluginId: "pluginA",
  });
  assertEquals(err._tag, "UnresolvableSlotRef");
});

Deno.test("Errors - undeclared cross-plugin dependency tag", () => {
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
  try {
    createKernel([pluginA, pluginB], { persistence: driver });
  } catch (err: unknown) {
    if (err instanceof Error) {
      assertEquals(
        err.message.includes('is not in the requires spec of "pluginB"'),
        true,
      );
    }
  }
  const err = new UndeclaredCrossPluginDependency({
    slotName: "slotB",
    pluginId: "pluginB",
    dep: "pluginA.slotA",
    targetPluginId: "pluginA",
  });
  assertEquals(err._tag, "UndeclaredCrossPluginDependency");
});

Deno.test("Errors - slot config invalid tag", () => {
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
  try {
    createKernel([pluginA], {
      persistence: driver,
      pluginConfig: {
        pluginA: { slotA: { count: "invalid" } },
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      assertEquals(
        err.message.includes(
          'Config validation failed for plugin "pluginA", slot "slotA"',
        ),
        true,
      );
    }
  }
  const err = new SlotConfigInvalid({
    pluginId: "pluginA",
    slotName: "slotA",
    parseError: "Expected number",
  });
  assertEquals(err._tag, "SlotConfigInvalid");
});

Deno.test("Errors - slot init failed tag", () => {
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
  try {
    createKernel([pluginA], { persistence: driver });
  } catch (err: unknown) {
    if (err instanceof Error) {
      assertEquals(
        err.message.includes('Failed to initialize slot "rl:pluginA:slotA"'),
        true,
      );
    }
  }
  const err = new SlotInitFailed({
    slotId: "rl:pluginA:slotA",
    cause: new Error("Init exploded"),
  });
  assertEquals(err._tag, "SlotInitFailed");
});
