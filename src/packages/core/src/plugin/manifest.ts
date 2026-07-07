import type { PersistenceDriver } from "../ports/persistence.ts";

export interface StoreRegistryEntry<TConfig = unknown, TStore = unknown> {
  id: string;
  contextKey?: symbol;
  pluginId?: string;
  factory: (
    config: TConfig,
    driver: PersistenceDriver,
    stores: Map<string, unknown>,
  ) => TStore | null;
  optional?: boolean;
  noPersistence?: boolean;
  dependsOn?: string[];
  conditional?: string;
}

export interface RunePlugin {
  id: string;
  stores: StoreRegistryEntry[];
  overlays?: unknown[];
  contributions?: {
    commands?: unknown[];
    shortcuts?: unknown[];
    navItems?: unknown[];
    settingsSections?: unknown[];
  };
}

export type PluginInput =
  | RunePlugin
  | PluginInput[]
  | null
  | undefined
  | boolean;

export function definePlugin(plugin: RunePlugin): RunePlugin {
  return plugin;
}

export function resolvePlugins(input: PluginInput[]): RunePlugin[] {
  const flat: RunePlugin[] = [];
  function process(item: PluginInput) {
    if (!item) return;
    if (Array.isArray(item)) {
      for (const sub of item) {
        process(sub);
      }
    } else if (typeof item === "object") {
      flat.push(item);
    }
  }
  for (const item of input) {
    process(item);
  }
  const seen = new Set<string>();
  return flat.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}
