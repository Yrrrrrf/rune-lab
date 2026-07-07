import type { PersistenceDriver } from "../ports/persistence.ts";

export function createInMemoryDriver(): PersistenceDriver {
  const store = new Map<string, string>();
  return {
    get: (key: string) => store.get(key) ?? null,
    set: (key: string, value: string) => {
      store.set(key, value);
    },
    remove: (key: string) => {
      store.delete(key);
    },
  };
}

export const inMemoryDriver: PersistenceDriver = createInMemoryDriver();

export function namespaced(
  driver: PersistenceDriver,
  prefix: string,
): PersistenceDriver {
  return {
    get: (key: string) => driver.get(`${prefix}${key}`),
    set: (key: string, value: string) => driver.set(`${prefix}${key}`, value),
    remove: (key: string) => driver.remove(`${prefix}${key}`),
  };
}
