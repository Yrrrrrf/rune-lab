import { Schema } from "effect";
import type { PersistenceDriver } from "../ports/persistence.ts";

const PluginId = Schema.String.pipe(Schema.brand("PluginId"));
type PluginId = Schema.Schema.Type<typeof PluginId>;

const RegistryId = Schema.String.pipe(Schema.brand("RegistryId"));
type RegistryId = Schema.Schema.Type<typeof RegistryId>;

const SymbolSchema = Schema.declare(
  (input): input is symbol => typeof input === "symbol",
  { identifier: "Symbol" },
);

const StoreRegistryEntrySchema = Schema.Struct({
  id: RegistryId,
  contextKey: Schema.optional(SymbolSchema),
  pluginId: Schema.optional(PluginId),
  factory: Schema.declare(
    (input): input is (...args: unknown[]) => unknown =>
      typeof input === "function",
    { identifier: "Function" },
  ),
  optional: Schema.optional(Schema.Boolean),
  noPersistence: Schema.optional(Schema.Boolean),
  dependsOn: Schema.optional(Schema.Array(Schema.String)),
  conditional: Schema.optional(Schema.String),
});

export interface StoreRegistryEntry<TConfig = unknown, TStore = unknown> {
  id: string & { readonly __brand?: "RegistryId" };
  contextKey?: symbol;
  pluginId?: string & { readonly __brand?: "PluginId" };
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

const RunePluginSchema = Schema.Struct({
  id: PluginId,
  stores: Schema.Array(StoreRegistryEntrySchema),
  overlays: Schema.optional(Schema.Array(Schema.Any)),
  contributions: Schema.optional(
    Schema.Record({
      key: Schema.String,
      value: Schema.Array(Schema.Any),
    }),
  ),
});

export interface RunePlugin {
  id: string & { readonly __brand?: "PluginId" };
  stores: StoreRegistryEntry[];
  overlays?: unknown[];
  contributions?: Record<string, unknown[]>;
}

export type PluginInput =
  | RunePlugin
  | PluginInput[]
  | null
  | undefined
  | boolean;

export function definePlugin(plugin: RunePlugin): RunePlugin {
  return Schema.decodeUnknownSync(RunePluginSchema)(
    plugin,
  ) as unknown as RunePlugin;
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
      const parsed = Schema.decodeUnknownSync(RunePluginSchema)(item);
      flat.push(parsed as unknown as RunePlugin);
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
