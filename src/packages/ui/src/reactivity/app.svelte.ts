import { DEV } from "esm-env";
import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "../provider/context.ts";

export interface AppData {
  name: string;
  version: string;
  description: string;
  author: string;
  repository?: string;
  license?: string;
  homepage?: string;
  icon?: string;
}

export class AppStore {
  name: string = $state("Rune Lab");
  version: string = $state("0.0.1");
  description: string = $state("Modern toolkit for Svelte 5 Runes");
  author: string = $state("Yrrrrrf");
  repository: string = $state("https://github.com/Yrrrrrf/rune-lab");
  license: string = $state("MIT");
  homepage: string = $state("https://jsr.io/@yrrrrrf/rune-lab");
  icon: string = $state("");

  #initialized = false;

  init(data: Partial<AppData>): void {
    if (this.#initialized) {
      if (DEV) {
        console.warn(
          "AppStore.init() called multiple times. Ignoring subsequent calls.",
          "Overwritten properties would have been:",
          data,
        );
      }
      return;
    }

    if (data.name) this.name = data.name;
    if (data.version) this.version = data.version;
    if (data.description) this.description = data.description;
    if (data.author) this.author = data.author;
    if (data.repository) this.repository = data.repository;
    if (data.license) this.license = data.license;
    if (data.homepage) this.homepage = data.homepage;
    if (data.icon) this.icon = data.icon;

    this.#initialized = true;
  }
}

export function createAppStore(): AppStore {
  return new AppStore();
}

export function getAppStore(): AppStore {
  const store = getContext<AppStore>(RUNE_LAB_CONTEXT.app);
  if (!store) {
    throw new Error(
      "[rune-lab] getAppStore() found no AppStore. Did you wrap your application in <RuneProvider>?",
    );
  }
  return store;
}
