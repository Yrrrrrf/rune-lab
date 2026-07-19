import type { Schema } from "effect";
import type { LocaleAdapter } from "../ports/locale.ts";
import type { TextMeasurer } from "../ports/text.ts";
import type { PersistenceHandle } from "./descriptors.ts";

export interface SlotContext<TConfig = unknown> {
  config: TConfig;
  persistence: PersistenceHandle;
  stores: Map<string, unknown>;
  locale?: LocaleAdapter;
  textMeasurer?: TextMeasurer;
}

export interface BaseSlotSpec {
  create(context: SlotContext<unknown>): unknown;
  config?: unknown;
  persist?: boolean | string[];
  dependsOn?: string[];
  expose?: boolean;
  contextKey?: never;
}

export interface SlotSpec<
  TConfig = unknown,
  TStore = unknown,
  TEncoded = TConfig,
> extends BaseSlotSpec {
  create(context: SlotContext<TConfig>): TStore;
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
