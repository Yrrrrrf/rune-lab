import type { SettingsSchema } from "./define-settings.ts";
import type { SlotSpec } from "./define-slot.ts";
import type { RunePlugin, StoreRegistryEntry } from "../plugin/manifest.ts";
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
  stores?: StoreRegistryEntry[];
}

export type PluginInput =
  | ForgedPlugin<string, Record<string, SlotSpec>>
  | RunePlugin
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

export function definePlugin(
  plugin: { id: string; stores?: StoreRegistryEntry[]; [key: string]: unknown },
): ForgedPlugin<string, Record<string, SlotSpec>>;

export function definePlugin(
  spec:
    | { id: string; stores?: StoreRegistryEntry[]; [key: string]: unknown }
    | { id: string; slots?: Record<string, SlotSpec>; [key: string]: unknown },
): ForgedPlugin<string, Record<string, SlotSpec>> {
  const s = spec as {
    id: string;
    stores?: StoreRegistryEntry[];
    slots?: Record<string, SlotSpec>;
    requires?: string[];
    settings?: SettingsSchema;
    overlays?: unknown[];
    contributions?: Record<string, unknown[]>;
  };

  if (s.stores && Array.isArray(s.stores)) {
    // Legacy plugin format
    const descriptors: Record<string, SlotDescriptor> = {};
    for (const store of s.stores) {
      descriptors[store.id] = {
        slotName: store.id,
        contextKey: store.contextKey || Symbol.for(`rl:${store.id}`),
        accessorName: getAccessorName(store.id),
      };
    }
    return {
      ...s,
      slots: {} as Record<string, SlotSpec>,
      descriptors,
      isLegacy: true,
    };
  }

  // New plugin format
  const slots: Record<string, SlotSpec> = s.slots || {};
  const descriptors: Record<string, SlotDescriptor> = {};
  for (const slotName of Object.keys(slots)) {
    descriptors[slotName] = {
      slotName,
      contextKey: getContextSymbol(s.id, slotName),
      accessorName: getAccessorName(slotName),
    };
  }

  return {
    id: s.id,
    requires: s.requires,
    slots,
    settings: s.settings,
    overlays: s.overlays,
    contributions: s.contributions,
    descriptors,
  };
}
