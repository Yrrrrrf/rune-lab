import type { PersistenceDriver } from "@rune-lab/core";
import {
  type ConfigStore,
  ConfigStoreImpl as VanillaConfigStoreImpl,
  type ConfigStoreOptions,
} from "@rune-lab/core";

class ReactiveConfigStoreImpl<T, K extends keyof T>
  implements ConfigStore<T, K> {
  #vanilla: VanillaConfigStoreImpl<T, K>;
  #current = $state<any>(null!);
  #available = $state<any[]>([]);

  constructor(options: ConfigStoreOptions<T, K>) {
    this.#vanilla = new VanillaConfigStoreImpl(options);
    this.#current = this.#vanilla.current;
    this.#available = this.#vanilla.available;

    this.#vanilla.onChange((newId) => {
      this.#current = newId;
    });
  }

  get current(): T[K] {
    return this.#current;
  }
  set current(val: T[K]) {
    this.set(val);
  }

  get available(): T[] {
    return this.#available;
  }
  set available(val: T[]) {
    this.#available = val;
  }

  set(id: T[K]): void {
    this.#vanilla.set(id);
    this.#current = this.#vanilla.current;
  }

  get(id: T[K]): T | undefined {
    return this.#vanilla.get(id);
  }

  getProp<P extends keyof T>(prop: P, id?: T[K]): T[P] | undefined {
    return this.#vanilla.getProp(prop, id);
  }

  addItems(newItems: T[]): void {
    this.#vanilla.addItems(newItems);
    this.#available = this.#vanilla.available;
  }

  onChange(cb: (newId: T[K], oldId: T[K]) => void): () => void {
    return this.#vanilla.onChange(cb);
  }

  setDriver(driver: PersistenceDriver): void {
    this.#vanilla.setDriver(driver);
    this.#current = this.#vanilla.current;
    this.#available = this.#vanilla.available;
  }
}

export function createConfigStore<T, K extends keyof T>(
  options: ConfigStoreOptions<T, K>,
): ConfigStore<T, K> {
  return new ReactiveConfigStoreImpl(options) as unknown as ConfigStore<T, K>;
}
export type { ConfigStore, ConfigStoreOptions };
