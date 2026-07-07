import { assertEquals, assertExists } from "@std/assert";
import { createKernel } from "./runtime.ts";
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
  assertEquals(kernel.getTheme(), "light");

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

  assertEquals(kernel.getTheme(), "light");
  assertEquals(driver.get("theme"), null);

  await kernel.setTheme("dark");
  assertEquals(kernel.getTheme(), "dark");
  assertEquals(driver.get("theme"), "dark");

  await kernel.setLanguage("fr");
  assertEquals(kernel.getLanguage(), "fr");
  assertEquals(driver.get("language"), "fr");

  await kernel.setCurrency("EUR");
  assertEquals(kernel.getCurrency(), "EUR");
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

  await kernel.setTheme("dark");

  assertEquals(callCount, 1);
  assertEquals(kernel.getCellVersion("theme"), initialVersion + 1);

  unsubscribe();
  await kernel.setTheme("light");

  // Listener should not fire after unsubscribe
  assertEquals(callCount, 1);

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

  // Verify declarative contributions are populated
  assertEquals(commandStore.commands.length, 1);
  assertEquals(commandStore.commands[0].id, "test-cmd");

  // Verify imperative mutations work
  kernel.registerCommand({ id: "imp-cmd", label: "Imperative" });
  const commands = kernel.getCommands();
  assertEquals(commands.length, 2);
  assertEquals((commands[1] as Record<string, unknown>).id, "imp-cmd");

  kernel.unregisterCommand("imp-cmd");
  assertEquals(kernel.getCommands().length, 1);

  await kernel.dispose();
});
