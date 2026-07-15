import { Schema } from "effect";
import type { PersistenceHandle } from "./descriptors.ts";

export interface SlotContext<TConfig = any> {
  config: TConfig;
  persistence: PersistenceHandle;
  stores: Map<string, unknown>;
}

export interface SlotSpec<TConfig = any, TStore = any> {
  create: (context: SlotContext<TConfig>) => TStore;
  config?: Schema.Schema<TConfig, any, any>;
  persist?: boolean | string[];
  dependsOn?: string[];
  expose?: boolean; // default true
}

export const SlotSpecSchema = Schema.Struct({
  create: Schema.declare(
    (input): input is (...args: any[]) => any => typeof input === "function",
    { identifier: "Function" },
  ),
  config: Schema.optional(Schema.Any),
  persist: Schema.optional(
    Schema.Union(Schema.Boolean, Schema.Array(Schema.String)),
  ),
  dependsOn: Schema.optional(Schema.Array(Schema.String)),
  expose: Schema.optional(Schema.Boolean),
});
