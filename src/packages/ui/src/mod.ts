export * from "@rune-lab/core";
export * from "./actions/portal.ts";
export { createPluginKit } from "./define/plugin-kit.ts";
export * from "./persistence/createConfigStore.svelte.ts";
export * from "./persistence/drivers.ts";
export * from "./persistence/usePersistence.ts";
export { default as RuneProvider } from "./RuneProvider.svelte";
export { default as SettingsFields } from "./settings/SettingsFields.svelte";

// Reactivity & Context exports
export { useCell } from "./reactivity/use-cell.svelte.ts";
export {
  type AppData,
  type AppStore,
  createAppStore,
  getAppStore,
  useApp,
} from "./reactivity/app.svelte.ts";
export {
  createAccessor,
  getKernel,
  getSettingsSections,
  RUNE_LAB_CONTEXT,
  type SettingsSection,
} from "./provider/context.ts";

import pkgConfig from "../deno.json" with { type: "json" };
export const version = (): string => pkgConfig.version;
