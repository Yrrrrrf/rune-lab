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
}

export type PluginInput =
  | ForgedPlugin<string, Record<string, SlotSpec>>
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
}): ForgedPlugin<TId, TSlots> {
  const slots: Record<string, SlotSpec> = spec.slots ||
    {} as Record<string, SlotSpec>;
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
    slots: slots as unknown as TSlots,
    settings: spec.settings,
    overlays: spec.overlays,
    contributions: spec.contributions,
    descriptors: descriptors as unknown as Record<keyof TSlots, SlotDescriptor>,
  };
}
