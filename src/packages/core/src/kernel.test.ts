import {
  assertEquals,
  assertExists,
  assertRejects,
  assertThrows,
} from "@std/assert";
import { Schema } from "effect";
import { createPersistedCell } from "./cells/persisted-cell.ts";
import { definePlugin } from "./forge/define-plugin.ts";
import { createKernel } from "./kernel/kernel.ts";
import { normalizeSlots, resolveSlotRef } from "./kernel/wiring.ts";
import { createInMemoryDriver, namespaced } from "./ports/memory.ts";

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
    config: {},
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
  const allSlots = normalizeSlots([
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

  const slotsMap = new Map(allSlots.map((s) => [s.id, s]));

  // Bare same-plugin ref
  const res1 = resolveSlotRef("localSlot", "pluginB", slotsMap);
  assertEquals(res1.id, "rl:pluginB:localSlot");

  // Dotted cross-plugin ref
  const res2 = resolveSlotRef("pluginA.theme", "pluginB", slotsMap);
  assertEquals(res2.id, "rl:pluginA:theme");

  // Fails loud on missing
  assertThrows(() => {
    resolveSlotRef("pluginA.missing", "pluginB", slotsMap);
  });
});

Deno.test("createPersistedCell - load and revert-on-failure", async () => {
  const driver = createInMemoryDriver();
  const handle = namespaced(driver, "rl:plugin:slot:");

  // Set initial value in driver
  await handle.set("", `"saved-value"`);

  // Initialize
  const cell = createPersistedCell(Schema.String, handle, "initial");

  // Verify load-on-create
  assertEquals(cell.get(), "saved-value");

  // Successful write
  cell.set("new-value");
  assertEquals(cell.get(), "new-value");
  assertEquals(await handle.get(""), "new-value");

  // Revert on failure (synchronous fail)
  const failingHandle = {
    get: () => null,
    set: () => {
      throw new Error("Disk full");
    },
    remove: () => {},
  };

  const cell2 = createPersistedCell(Schema.String, failingHandle, "initial");
  assertThrows(() => {
    cell2.set("fail");
  });
  assertEquals(cell2.get(), "initial");

  // Revert on failure (asynchronous fail)
  const failingAsyncHandle = {
    get: () => null,
    set: () => Promise.reject(new Error("Async write failed")),
    remove: () => {},
  };

  const cell3 = createPersistedCell(
    Schema.String,
    failingAsyncHandle,
    "initial",
  );
  await assertRejects(async () => {
    await cell3.set("fail");
  });
  assertEquals(cell3.get(), "initial");
});

Deno.test("Kernel - contributions and lifecycle", async () => {
  const driver = createInMemoryDriver();

  const plugin = definePlugin({
    id: "test.plugin",
    contributions: {
      commands: [{ id: "test-cmd", label: "Test Command" }],
    },
  });

  const kernel = createKernel([plugin], {
    config: {},
    persistence: driver,
  });

  // Verify declarative contributions
  let commands = kernel.getContributions("commands");
  assertEquals(commands.length, 1);
  assertEquals((commands[0] as any).id, "test-cmd");

  // Verify imperative mutations
  kernel.registerContribution("commands", {
    id: "imp-cmd",
    label: "Imperative",
  });
  commands = kernel.getContributions("commands");
  assertEquals(commands.length, 2);
  assertEquals((commands[1] as any).id, "imp-cmd");

  kernel.unregisterContribution("commands", "imp-cmd");
  commands = kernel.getContributions("commands");
  assertEquals(commands.length, 1);

  await kernel.dispose();
});
