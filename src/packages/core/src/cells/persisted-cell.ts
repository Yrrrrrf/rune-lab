import { Schema } from "effect";
import { StateCell } from "./define-cell.ts";
import type { PersistenceHandle } from "../forge/descriptors.ts";
import { Effect, SubscriptionRef } from "effect";

export function createPersistedCell<T>(
  schema: Schema.Schema<T, any, never>,
  handle: PersistenceHandle,
  initialValue: T,
  key = "",
): StateCell<T> {
  const ref = SubscriptionRef.make(initialValue).pipe(Effect.runSync);
  const cell = new StateCell(ref);

  const applyValue = (val: string | null) => {
    if (val !== null && val !== undefined) {
      try {
        const parsed = JSON.parse(val);
        const decoded = Schema.decodeUnknownSync(schema)(parsed);
        cell.set(decoded);
      } catch {
        try {
          const decoded = Schema.decodeUnknownSync(schema)(val);
          cell.set(decoded);
        } catch {
          // ignore decoding errors, keep initial value
        }
      }
    }
  };

  const saved = handle.get(key);
  if (saved instanceof Promise) {
    saved.then(applyValue).catch(() => {});
  } else {
    applyValue(saved);
  }

  const originalSet = cell.set.bind(cell);
  cell.set = (value: T): any => {
    const oldValue = cell.get();
    originalSet(value);

    try {
      const encoded = Schema.encodeSync(schema)(value);
      const stringValue = typeof encoded === "string"
        ? encoded
        : JSON.stringify(encoded);
      const res = handle.set(key, stringValue);
      if (res instanceof Promise) {
        return res.catch((e) => {
          originalSet(oldValue);
          console.error(
            `[PersistedCell] Failed to save value (reverted to old value):`,
            e,
          );
          throw e;
        });
      }
    } catch (e) {
      originalSet(oldValue);
      console.error(
        `[PersistedCell] Failed to save value (reverted to old value):`,
        e,
      );
      throw e;
    }
  };

  return cell;
}
