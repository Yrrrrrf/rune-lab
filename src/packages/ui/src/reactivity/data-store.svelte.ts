import { DEV } from "esm-env";

export type NullableData<T> = {
  [K in keyof T]: T[K] | null;
};

export interface DataStore<T extends object> {
  readonly data: NullableData<T>;
  init(input?: Partial<T>): void;
}

export function createDataStore<T extends object>(
  keys: readonly (keyof T & string)[],
): DataStore<T> {
  const initial = {} as Record<string, unknown>;
  for (const k of keys) {
    initial[k] = null;
  }
  const data = $state(initial) as NullableData<T>;
  let initialized = false;

  return {
    get data() {
      return data;
    },
    init(input?: Partial<T>) {
      if (initialized) {
        if (DEV) {
          console.warn(
            "DataStore.init() called multiple times. Ignoring subsequent calls.",
            "Overwritten properties would have been:",
            input,
          );
        }
        return;
      }
      initialized = true;

      if (input) {
        for (const k of keys) {
          const val = input[k];
          if (val !== undefined && val !== null) {
            (data as Record<string, unknown>)[k] = val;
          }
        }
      }
    },
  };
}
