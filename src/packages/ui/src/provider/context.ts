import type { Kernel, SettingsFieldSchema } from "@rune-lab/core";
import type { Component } from "svelte";
import { getContext } from "svelte";

export const RUNE_LAB_CONTEXT: {
  kernel: symbol;
  app: symbol;
  persistence: symbol;
  settingsSections: symbol;
} = {
  kernel: Symbol("rl:kernel"),
  app: Symbol("rl:app"),
  persistence: Symbol("rl:persistence"),
  settingsSections: Symbol("rl:settings-sections"),
} as const;

export function getKernel<TCells = Record<string, unknown>>(): Kernel<TCells> {
  const kernel = getContext<Kernel<TCells>>(RUNE_LAB_CONTEXT.kernel);
  if (!kernel) {
    throw new Error(
      "[rune-lab] getKernel() found no Kernel. Did you wrap your application in <RuneProvider>?",
    );
  }
  return kernel;
}

export function createAccessor<T>(
  contextKey: symbol,
  accessorName: string,
  storeName: string,
  pluginName: string,
): () => T {
  return () => {
    const store = getContext<T>(contextKey);
    if (!store) {
      throw new Error(
        `[rune-lab] ${accessorName} found no ${storeName}. Did you register ${pluginName} in <RuneProvider plugins={[…]}>?`,
      );
    }
    return store;
  };
}

export interface SettingsSection {
  id: string;
  label: string;
  icon?: string;
  fields?: SettingsFieldSchema[];
  component?: Component;
}

export const getSettingsSections: () => SettingsSection[] = createAccessor<
  SettingsSection[]
>(
  RUNE_LAB_CONTEXT.settingsSections,
  "getSettingsSections()",
  "SettingsSections",
  "RuneProvider",
);
