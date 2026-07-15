import { Schema } from "effect";
import type { StateCell } from "../cells/define-cell.ts";
import { getCellSchema } from "../cells/schemas.ts";
import type { LocaleAdapter } from "../ports/locale.ts";
import type { PersistenceDriver } from "../ports/persistence.ts";

async function writePersistence(
  persistence: PersistenceDriver,
  name: string,
  value: unknown,
): Promise<void> {
  const schema = getCellSchema(name, value);
  const encoded = Schema.encodeSync(schema)(value);
  const stringValue = typeof encoded === "string"
    ? encoded
    : JSON.stringify(encoded);
  const res = persistence.set(name, stringValue);
  if (res instanceof Promise) await res;
}

async function updateLocale(
  localeAdapter: LocaleAdapter,
  value: string,
): Promise<void> {
  try {
    const res = localeAdapter.setLocale(value);
    if (res instanceof Promise) await res;
  } catch (e) {
    console.error("[Kernel] Locale adapter setLocale failed:", e);
  }
}

export async function setCellLifecycle<TCells>(
  cells: Record<string, StateCell<unknown>>,
  cellName: keyof TCells,
  value: TCells[keyof TCells],
  persistence: PersistenceDriver,
  localeAdapter?: LocaleAdapter,
): Promise<void> {
  const nameStr = cellName as string;
  const cell = cells[nameStr];
  if (!cell) {
    throw new Error(`[Kernel] Cell "${nameStr}" does not exist`);
  }
  const oldValue = cell.get();
  cell.set(value);

  const isStandardPersistenceKey = nameStr === "theme" ||
    nameStr === "language" || nameStr === "currency";

  try {
    if (isStandardPersistenceKey) {
      await writePersistence(persistence, nameStr, value);
    }

    if (nameStr === "language" && localeAdapter) {
      await updateLocale(localeAdapter, value as string);
    }
  } catch (e) {
    cell.set(oldValue);
    console.error(
      `[Kernel] Failed to set cell "${nameStr}" (reverted to old value):`,
      e,
    );
    throw e;
  }
}

export function registerContributionLifecycle(
  cells: Record<string, StateCell<unknown>>,
  key: string,
  item: unknown,
): void {
  const contributionsCell = cells.contributions;
  if (!contributionsCell) return;
  const registry = {
    ...(contributionsCell.get() as Record<string, unknown[]>),
  };
  const list = registry[key] ? [...registry[key]] : [];
  list.push(item);
  registry[key] = list;
  contributionsCell.set(registry);
}

export function unregisterContributionLifecycle(
  cells: Record<string, StateCell<unknown>>,
  key: string,
  id: string,
): void {
  const contributionsCell = cells.contributions;
  if (!contributionsCell) return;
  const registry = {
    ...(contributionsCell.get() as Record<string, unknown[]>),
  };
  if (registry[key]) {
    registry[key] = registry[key].filter((item) => {
      const obj = item as Record<string, unknown>;
      return !obj || obj.id !== id;
    });
    contributionsCell.set(registry);
  }
}
