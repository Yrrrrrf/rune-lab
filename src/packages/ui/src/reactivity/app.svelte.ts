import { getContext } from "svelte";
import { RUNE_LAB_CONTEXT } from "../provider/context.ts";
import { createDataStore, type DataStore } from "./data-store.svelte.ts";

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

const APP_DATA_KEYS = [
  "name",
  "version",
  "description",
  "author",
  "repository",
  "license",
  "homepage",
  "icon",
] as const satisfies readonly (keyof AppData)[];

type ExpectEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never)
  : never;
type _ExhaustivenessCheck = ExpectEqual<
  typeof APP_DATA_KEYS[number],
  keyof AppData
>;

export type AppStore = DataStore<AppData>;

export function createAppStore(): AppStore {
  return createDataStore<AppData>(APP_DATA_KEYS);
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
