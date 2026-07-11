import { assertEquals, assertExists } from "@std/assert";
import { createKernel } from "./kernel.ts";
import { createInMemoryDriver } from "./persistence/memory.ts";
import type { RunePlugin } from "./plugin/manifest.ts";

Deno.test("Kernel - manifest resolution and store topological sort initialization", async () => {
  const driver = createInMemoryDriver();

  const storeA = {
    id: "storeA",
    factory: () => "A",
  };

  const storeB = {
    id: "storeB",
    factory: (
      _config: unknown,
      _drv: unknown,
      stores: Map<string, unknown>,
    ) => {
      const a = stores.get("storeA");
      return `B(${a})`;
    },
    dependsOn: ["storeA"],
  };

  const plugin: RunePlugin = {
    id: "test.plugin",
    stores: [storeB, storeA],
  };

  const kernel = await createKernel([plugin], {
    config: {},
    persistence: driver,
  });

  assertExists(kernel);
  assertEquals(kernel.getCell("theme"), "light");

  // Verify topological sorting worked (storeB succeeded because storeA was created first)
  const initializedA = kernel.stores.get("storeA");
  const initializedB = kernel.stores.get("storeB");

  assertEquals(initializedA, "A");
  assertEquals(initializedB, "B(A)");

  await kernel.dispose();
});

Deno.test("Kernel - state mutations write back to persistence", async () => {
  const driver = createInMemoryDriver();

  const kernel = await createKernel([], {
    config: {},
    persistence: driver,
  });

  assertEquals(kernel.getCell("theme"), "light");
  assertEquals(driver.get("theme"), null);

  await kernel.setCell("theme", "dark");
  assertEquals(kernel.getCell("theme"), "dark");
  assertEquals(driver.get("theme"), "dark");

  await kernel.setCell("language", "fr");
  assertEquals(kernel.getCell("language"), "fr");
  assertEquals(driver.get("language"), "fr");

  await kernel.setCell("currency", "EUR");
  assertEquals(kernel.getCell("currency"), "EUR");
  assertEquals(driver.get("currency"), "EUR");

  await kernel.dispose();
});

Deno.test("Kernel - subscribe and version updates", async () => {
  const driver = createInMemoryDriver();

  const kernel = await createKernel([], {
    config: {},
    persistence: driver,
  });

  let callCount = 0;
  const unsubscribe = kernel.subscribe("theme", () => {
    callCount++;
  });

  const initialVersion = kernel.getCellVersion("theme");

  await kernel.setCell("theme", "dark");

  assertEquals(callCount, 1);
  assertEquals(kernel.getCellVersion("theme"), initialVersion + 1);

  unsubscribe();
  await kernel.setCell("theme", "light");

  // Listener should not fire after unsubscribe
  assertEquals(callCount, 1);

  await kernel.dispose();
});

Deno.test("Kernel - generic getCell and setCell API", async () => {
  const driver = createInMemoryDriver();

  const kernel = createKernel([], {
    config: {},
    persistence: driver,
  });

  assertEquals(kernel.getCell("theme"), "light");
  await kernel.setCell("theme", "dark");
  assertEquals(kernel.getCell("theme"), "dark");
  assertEquals(driver.get("theme"), "dark");

  await kernel.dispose();
});

Deno.test("Kernel - declarative and imperative contributions", async () => {
  const driver = createInMemoryDriver();

  const commandStore = {
    commands: [] as Record<string, unknown>[],
    register(cmd: unknown) {
      this.commands.push(cmd as Record<string, unknown>);
    },
    unregister(id: string) {
      this.commands = this.commands.filter((c) => c.id !== id);
    },
  };

  const commandRegistryEntry = {
    id: "commands",
    factory: () => commandStore,
  };

  const plugin: RunePlugin = {
    id: "test.plugin",
    stores: [commandRegistryEntry],
    contributions: {
      commands: [{ id: "test-cmd", label: "Test Command" }],
    },
  };

  const kernel = await createKernel([plugin], {
    config: {},
    persistence: driver,
  });

  // Verify declarative contributions are populated in store
  assertEquals(commandStore.commands.length, 1);
  assertEquals(commandStore.commands[0].id, "test-cmd");

  // Verify imperative mutations work on generic contributions bag
  kernel.registerContribution("commands", {
    id: "imp-cmd",
    label: "Imperative",
  });
  const commands = kernel.getContributions("commands");
  // The list should have 2 items: 1 from plugin declaration, 1 from imperative register
  assertEquals(commands.length, 2);
  assertEquals((commands[1] as Record<string, unknown>).id, "imp-cmd");

  kernel.unregisterContribution("commands", "imp-cmd");
  assertEquals(kernel.getContributions("commands").length, 1);

  await kernel.dispose();
});

Deno.test("Kernel - non-default persisted theme survives load", async () => {
  const driver = createInMemoryDriver();
  driver.set("theme", "cupcake");

  const kernel = await createKernel([], {
    config: {},
    persistence: driver,
  });

  // Wait for the async load synchronizer
  await new Promise((r) => setTimeout(r, 10));

  assertEquals(kernel.getCell("theme"), "cupcake");
  await kernel.dispose();
});
