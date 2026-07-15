// deno-lint-ignore-file no-explicit-any

import type { ForgedPlugin } from "@rune-lab/core";
import { createAccessor } from "../context.ts";

export function createPluginKit<
  TId extends string,
  TSlots extends Record<string, any>,
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
  const accessors = {} as any;
  const descriptors = forgedPlugin.descriptors || {};

  for (const [slotName, descriptor] of Object.entries(descriptors)) {
    const slotSpec = forgedPlugin.slots?.[slotName];
    if (!slotSpec || slotSpec.expose !== false) {
      const accessorName = descriptor.accessorName;
      const contextKey = descriptor.contextKey;

      accessors[accessorName] = createAccessor(
        contextKey,
        `${accessorName}()`,
        `${slotName}Store`,
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
