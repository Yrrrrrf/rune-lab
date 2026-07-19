import { Schema } from "effect";
import type { LocaleAdapter } from "../ports/locale.ts";
import type { PersistenceHandle } from "./descriptors.ts";
import type { TextMeasurer } from "../ports/text.ts";

export interface SlotContext<TConfig = unknown> {
  config: TConfig;
  persistence: PersistenceHandle;
  stores: Map<string, unknown>;
  locale?: LocaleAdapter;
  textMeasurer?: TextMeasurer;
}

export interface SlotSpec<
  TConfig = unknown,
  TStore = unknown,
  TEncoded = TConfig,
> {
  create: (context: SlotContext<TConfig>) => TStore;
  config?: Schema.Schema<TConfig, TEncoded, never>;
  persist?: boolean | string[];
  dependsOn?: string[];
  expose?: boolean; // default true
  contextKey?: never;
}

export function defineSlot<TConfig, TStore, TEncoded = TConfig>(
  spec: SlotSpec<TConfig, TStore, TEncoded>,
): SlotSpec<TConfig, TStore, TEncoded> {
  return spec;
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
