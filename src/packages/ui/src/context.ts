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
  component: unknown;
}

export const getSettingsSections: () => SettingsSection[] = createAccessor<
  SettingsSection[]
>(
  RUNE_LAB_CONTEXT.settingsSections,
  "getSettingsSections()",
  "SettingsSections",
  "RuneProvider",
);
