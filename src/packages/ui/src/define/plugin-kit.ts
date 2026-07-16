import type { ForgedPlugin, SlotSpec } from "@rune-lab/core";
import { createAccessor } from "../provider/context.ts";

export function createPluginKit<
  TId extends string,
  TSlots extends Record<string, SlotSpec>,
>(
  forgedPlugin: ForgedPlugin<TId, TSlots>,
): {
  plugin: ForgedPlugin<TId, TSlots>;
  accessors: {
    [K in keyof TSlots as `get${Capitalize<K & string>}Store`]: () =>
      ReturnType<
        TSlots[K]["create"]
      >;
  };
} {
  const accessors = {} as Record<string, () => unknown>;
  const descriptors = forgedPlugin.descriptors || {};

  for (const [slotName, descriptor] of Object.entries(descriptors)) {
    const slotSpec = forgedPlugin.slots?.[slotName];
    if (!slotSpec || slotSpec.expose !== false) {
      const accessorName = descriptor.accessorName;
      const contextKey = descriptor.contextKey;

      const capitalizedSlot = slotName.charAt(0).toUpperCase() +
        slotName.slice(1);
      accessors[accessorName] = createAccessor(
        contextKey,
        `${accessorName}()`,
        `${capitalizedSlot}Store`,
        forgedPlugin.id,
      );
    }
  }

  return {
    plugin: forgedPlugin,
    accessors,
  } as {
    plugin: ForgedPlugin<TId, TSlots>;
    accessors: {
      [K in keyof TSlots as `get${Capitalize<K & string>}Store`]: () =>
        ReturnType<
          TSlots[K]["create"]
        >;
    };
  };
}
