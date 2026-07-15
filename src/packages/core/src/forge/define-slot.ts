import { Schema } from "effect";
import type { PersistenceHandle } from "./descriptors.ts";

export interface SlotContext<TConfig = unknown> {
  config: TConfig;
  persistence: PersistenceHandle;
  stores: Map<string, unknown>;
}

export interface SlotSpec<TConfig = unknown, TStore = unknown> {
  create: (context: SlotContext<TConfig>) => TStore;
  config?: Schema.Schema<TConfig, unknown, never>;
  persist?: boolean | string[];
  dependsOn?: string[];
  expose?: boolean; // default true
}

export const SlotSpecSchema = Schema.Struct({
  create: Schema.declare(
    (input): input is (...args: unknown[]) => unknown =>
      typeof input === "function",
    { identifier: "Function" },
  ),
  config: Schema.optional(Schema.Any),
  persist: Schema.optional(
    Schema.Union(Schema.Boolean, Schema.Array(Schema.String)),
  ),
  dependsOn: Schema.optional(Schema.Array(Schema.String)),
  expose: Schema.optional(Schema.Boolean),
});
