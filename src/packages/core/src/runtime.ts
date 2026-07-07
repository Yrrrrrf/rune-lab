import { Context, Effect, Fiber, Layer, Stream, SubscriptionRef } from "effect";
import type { PersistenceDriver } from "./ports/persistence.ts";
import type { LocaleAdapter } from "./ports/locale.ts";
import { resolvePlugins } from "./plugin/manifest.ts";
import { createInMemoryDriver } from "./persistence/memory.ts";
import { STORE_REGISTRY, topologicalSort } from "./registry/registry.ts";

export interface PersistenceService {
  readonly driver: PersistenceDriver;
}

export const PersistenceService = Context.GenericTag<PersistenceService>(
  "@rune-lab/core/PersistenceService",
);

export const makePersistenceLayer = (driver: PersistenceDriver) =>
  Layer.succeed(PersistenceService, PersistenceService.of({ driver }));

class CellManager<T> {
  version = 0;
  listeners = new Set<() => void>();
  constructor(public ref: SubscriptionRef.SubscriptionRef<T>) {}
}

export interface Kernel {
  stores: Map<string, unknown>;
  overlays: unknown[];
  getTheme(): string;
  getLanguage(): string;
  getCurrency(): string;
  getCommands(): unknown[];
  getShortcuts(): unknown[];
  getNavItems(): unknown[];
  getSettingsSections(): unknown[];

  setTheme(theme: string): Promise<void>;
  setLanguage(lang: string): Promise<void>;
  setCurrency(currency: string): Promise<void>;

  registerCommand(cmd: unknown): void;
  unregisterCommand(id: string): void;
  registerShortcut(sc: unknown): void;
  unregisterShortcut(id: string): void;

  subscribe(cellName: string, listener: () => void): () => void;
  getCellVersion(cellName: string): number;

  dispose(): Promise<void>;
}

import type { PluginInput } from "./plugin/manifest.ts";

export function createKernel(
  pluginsInput: PluginInput[],
  options: {
    config: Record<string, unknown>;
    persistence: PersistenceDriver;
    localeAdapter?: LocaleAdapter;
  },
): Kernel {
  const resolved = resolvePlugins(pluginsInput);

  // Register all resolved plugins' store templates
  for (const plugin of resolved) {
    for (const slot of plugin.stores) {
      if (!slot.pluginId) {
        slot.pluginId = plugin.id;
      }
      STORE_REGISTRY.set(slot.id, slot);
    }
  }

  const entries = Array.from(STORE_REGISTRY.values());
  const sorted = topologicalSort(entries);
  const stores = new Map<string, unknown>();

  for (const entry of sorted) {
    const pluginConfig = entry.pluginId && options.config[entry.pluginId]
      ? (options.config[entry.pluginId] as Record<string, unknown>)
      : options.config;

    if (entry.conditional && !(entry.conditional in pluginConfig)) {
      continue;
    }

    const effectiveDriver = entry.noPersistence
      ? createInMemoryDriver()
      : options.persistence;
    const store = entry.factory(pluginConfig, effectiveDriver, stores);

    if (store === null && entry.optional) {
      continue;
    }

    if (store !== null && store !== undefined) {
      stores.set(entry.id, store);
    }
  }

  // Auto-register declarative contributions to the created stores
  for (const plugin of resolved) {
    if (plugin.contributions) {
      const { commands, shortcuts } = plugin.contributions;
      if (commands && stores.has("commands")) {
        const commandStore = stores.get("commands") as {
          register(cmd: unknown): void;
        };
        for (const cmd of commands) {
          commandStore.register(cmd);
        }
      }
      if (shortcuts && stores.has("shortcut")) {
        const shortcutStore = stores.get("shortcut") as {
          register(sc: unknown): void;
        };
        for (const sc of shortcuts) {
          shortcutStore.register(sc);
        }
      }
    }
  }

  // Initialize values from persistence driver
  const driver = options.persistence;

  // Create the SubscriptionRefs inside the Effect runtime
  const cellsProgram = Effect.gen(function* () {
    const theme = yield* SubscriptionRef.make("light");
    const language = yield* SubscriptionRef.make("en");
    const currency = yield* SubscriptionRef.make("USD");
    const commands = yield* SubscriptionRef.make<unknown[]>([]);
    const shortcuts = yield* SubscriptionRef.make<unknown[]>([]);
    const navItems = yield* SubscriptionRef.make<unknown[]>([]);
    const settingsSections = yield* SubscriptionRef.make<unknown[]>([]);

    return {
      theme,
      language,
      currency,
      commands,
      shortcuts,
      navItems,
      settingsSections,
    };
  });

  const cells = Effect.runSync(cellsProgram);

  const managers: Record<string, CellManager<unknown>> = {
    theme: new CellManager(
      cells.theme as unknown as SubscriptionRef.SubscriptionRef<unknown>,
    ),
    language: new CellManager(
      cells.language as unknown as SubscriptionRef.SubscriptionRef<unknown>,
    ),
    currency: new CellManager(
      cells.currency as unknown as SubscriptionRef.SubscriptionRef<unknown>,
    ),
    commands: new CellManager(
      cells.commands as unknown as SubscriptionRef.SubscriptionRef<unknown>,
    ),
    shortcuts: new CellManager(
      cells.shortcuts as unknown as SubscriptionRef.SubscriptionRef<unknown>,
    ),
    navItems: new CellManager(
      cells.navItems as unknown as SubscriptionRef.SubscriptionRef<unknown>,
    ),
    settingsSections: new CellManager(
      cells.settingsSections as unknown as SubscriptionRef.SubscriptionRef<
        unknown
      >,
    ),
  };

  const fiberSet = new Set<Fiber.Fiber<unknown, unknown>>();

  // Run the background watch streams using Deno/Effect runtime
  const watchCell = <T>(name: string, manager: CellManager<T>) => {
    const streamProgram = Stream.runForEach(
      manager.ref.changes,
      () =>
        Effect.sync(() => {
          manager.version++;
          for (const listener of manager.listeners) {
            try {
              listener();
            } catch (e) {
              console.error(`[Kernel] Listener error in cell ${name}:`, e);
            }
          }
        }),
    );
    const fiber = Effect.runFork(streamProgram);
    fiberSet.add(fiber);
  };

  for (const [name, manager] of Object.entries(managers)) {
    watchCell(name, manager);
  }

  // Pre-populate declarative contributions
  const initialCommands: unknown[] = [];
  const initialShortcuts: unknown[] = [];
  const initialNavItems: unknown[] = [];
  const initialSettingsSections: unknown[] = [];
  const overlays: unknown[] = [];

  for (const plugin of resolved) {
    if (plugin.contributions) {
      if (plugin.contributions.commands) {
        initialCommands.push(...plugin.contributions.commands);
      }
      if (plugin.contributions.shortcuts) {
        initialShortcuts.push(...plugin.contributions.shortcuts);
      }
      if (plugin.contributions.navItems) {
        initialNavItems.push(...plugin.contributions.navItems);
      }
      if (plugin.contributions.settingsSections) {
        initialSettingsSections.push(...plugin.contributions.settingsSections);
      }
    }
    if (plugin.overlays) {
      overlays.push(...plugin.overlays);
    }
  }

  if (initialCommands.length > 0) {
    Effect.runSync(SubscriptionRef.set(cells.commands, initialCommands));
  }
  if (initialShortcuts.length > 0) {
    Effect.runSync(SubscriptionRef.set(cells.shortcuts, initialShortcuts));
  }
  if (initialNavItems.length > 0) {
    Effect.runSync(SubscriptionRef.set(cells.navItems, initialNavItems));
  }
  if (initialSettingsSections.length > 0) {
    Effect.runSync(
      SubscriptionRef.set(cells.settingsSections, initialSettingsSections),
    );
  }

  if (driver) {
    const loadInitial = async (
      key: string,
      cell: SubscriptionRef.SubscriptionRef<string>,
      fallback: string,
    ) => {
      try {
        const val = driver.get(key);
        const resolvedVal = val instanceof Promise ? await val : val;
        if (resolvedVal !== undefined && resolvedVal !== null) {
          Effect.runSync(SubscriptionRef.set(cell, resolvedVal));
        }
      } catch {
        Effect.runSync(SubscriptionRef.set(cell, fallback));
      }
    };
    loadInitial("theme", cells.theme, "light");
    loadInitial("language", cells.language, "en");
    loadInitial("currency", cells.currency, "USD");
  }

  if (options.localeAdapter) {
    const initial = options.localeAdapter.getLocale();
    if (initial) {
      Effect.runSync(SubscriptionRef.set(cells.language, initial));
    }
    options.localeAdapter.onChange((lang) => {
      const current = Effect.runSync(SubscriptionRef.get(cells.language));
      if (current !== lang) {
        Effect.runSync(SubscriptionRef.set(cells.language, lang));
      }
    });
  }

  return {
    stores,
    overlays,
    getTheme: () => Effect.runSync(SubscriptionRef.get(cells.theme)),
    getLanguage: () => Effect.runSync(SubscriptionRef.get(cells.language)),
    getCurrency: () => Effect.runSync(SubscriptionRef.get(cells.currency)),
    getCommands: () => Effect.runSync(SubscriptionRef.get(cells.commands)),
    getShortcuts: () => Effect.runSync(SubscriptionRef.get(cells.shortcuts)),
    getNavItems: () => Effect.runSync(SubscriptionRef.get(cells.navItems)),
    getSettingsSections: () =>
      Effect.runSync(SubscriptionRef.get(cells.settingsSections)),

    setTheme: async (theme: string) => {
      Effect.runSync(SubscriptionRef.set(cells.theme, theme));
      try {
        const res = driver.set("theme", theme);
        if (res instanceof Promise) await res;
      } catch (e) {
        console.error("[Kernel] Persistence write failed for theme:", e);
      }
    },

    setLanguage: async (lang: string) => {
      Effect.runSync(SubscriptionRef.set(cells.language, lang));
      if (options.localeAdapter) {
        try {
          const res = options.localeAdapter.setLocale(lang);
          if (res instanceof Promise) await res;
        } catch (e) {
          console.error("[Kernel] Locale adapter setLocale failed:", e);
        }
      }
      try {
        const res = driver.set("language", lang);
        if (res instanceof Promise) await res;
      } catch (e) {
        console.error("[Kernel] Persistence write failed for language:", e);
      }
    },

    setCurrency: async (curr: string) => {
      Effect.runSync(SubscriptionRef.set(cells.currency, curr));
      try {
        const res = driver.set("currency", curr);
        if (res instanceof Promise) await res;
      } catch (e) {
        console.error("[Kernel] Persistence write failed for currency:", e);
      }
    },

    registerCommand: (cmd: unknown) => {
      const current = Effect.runSync(SubscriptionRef.get(cells.commands));
      Effect.runSync(SubscriptionRef.set(cells.commands, [...current, cmd]));
    },

    unregisterCommand: (id: string) => {
      const current = Effect.runSync(SubscriptionRef.get(cells.commands));
      Effect.runSync(
        SubscriptionRef.set(
          cells.commands,
          current.filter((c) => {
            const obj = c as Record<string, unknown>;
            return !obj || obj.id !== id;
          }),
        ),
      );
    },

    registerShortcut: (sc: unknown) => {
      const current = Effect.runSync(SubscriptionRef.get(cells.shortcuts));
      Effect.runSync(SubscriptionRef.set(cells.shortcuts, [...current, sc]));
    },

    unregisterShortcut: (id: string) => {
      const current = Effect.runSync(SubscriptionRef.get(cells.shortcuts));
      Effect.runSync(
        SubscriptionRef.set(
          cells.shortcuts,
          current.filter((s) => {
            const obj = s as Record<string, unknown>;
            return !obj || obj.id !== id;
          }),
        ),
      );
    },

    subscribe: (cellName: string, listener: () => void) => {
      const manager = managers[cellName];
      if (!manager) {
        throw new Error(`[Kernel] Cell "${cellName}" does not exist`);
      }
      manager.listeners.add(listener);
      return () => {
        manager.listeners.delete(listener);
      };
    },

    getCellVersion: (cellName: string) => {
      const manager = managers[cellName];
      if (!manager) {
        throw new Error(`[Kernel] Cell "${cellName}" does not exist`);
      }
      return manager.version;
    },

    dispose: async () => {
      for (const fiber of fiberSet) {
        await Effect.runPromise(Fiber.interrupt(fiber));
      }
      fiberSet.clear();
      for (const manager of Object.values(managers)) {
        manager.listeners.clear();
      }
    },
  };
}
