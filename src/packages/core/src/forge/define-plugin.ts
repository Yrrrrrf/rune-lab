// deno-lint-ignore-file no-explicit-any
import type { SettingsSchema } from "./define-settings.ts";
import type { SlotSpec } from "./define-slot.ts";
import {
  getAccessorName,
  getContextSymbol,
  type SlotDescriptor,
} from "./descriptors.ts";

export interface ForgedPlugin<
  TId extends string = string,
  TSlots extends Record<string, SlotSpec> = Record<string, SlotSpec>,
> {
  id: TId;
  requires?: string[];
  slots: TSlots;
  settings?: SettingsSchema;
  overlays?: unknown[];
  contributions?: Record<string, unknown[]>;
  descriptors: Record<keyof TSlots, SlotDescriptor>;
  isLegacy?: boolean;
  stores?: any[];
}

export type PluginInput =
  | ForgedPlugin<any, any>
  | PluginInput[]
  | null
  | undefined
  | boolean;

export function definePlugin<
  TId extends string,
  TSlots extends Record<string, SlotSpec>,
>(spec: {
  id: TId;
  requires?: string[];
  slots?: TSlots;
  settings?: SettingsSchema;
  overlays?: unknown[];
  contributions?: Record<string, unknown[]>;
}): ForgedPlugin<TId, TSlots>;

export function definePlugin(plugin: any): any;

export function definePlugin(spec: any): any {
  if (spec.stores && Array.isArray(spec.stores)) {
    // Legacy plugin format
    const descriptors: Record<string, SlotDescriptor> = {};
    for (const store of spec.stores) {
      descriptors[store.id] = {
        slotName: store.id,
        contextKey: store.contextKey || Symbol.for(`rl:${store.id}`),
        accessorName: getAccessorName(store.id),
      };
    }
    return {
      ...spec,
      isLegacy: true,
      descriptors,
    };
  }

  // New plugin format
  const slots = spec.slots || {};
  const descriptors: Record<string, SlotDescriptor> = {};
  for (const slotName of Object.keys(slots)) {
    descriptors[slotName] = {
      slotName,
      contextKey: getContextSymbol(spec.id, slotName),
      accessorName: getAccessorName(slotName),
    };
  }

  return {
    id: spec.id,
    requires: spec.requires,
    slots,
    settings: spec.settings,
    overlays: spec.overlays,
    contributions: spec.contributions,
    descriptors,
  };
}
