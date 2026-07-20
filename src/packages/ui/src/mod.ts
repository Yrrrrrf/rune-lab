export * from "rune-lab/core";
export * from "./actions/portal.ts";
export { createPluginKit } from "./define/plugin-kit.ts";
export * from "./persistence/createConfigStore.svelte.ts";
export * from "./persistence/drivers.ts";
export * from "./persistence/usePersistence.ts";
export {
  createAccessor,
  getKernel,
  getSettingsSections,
  RUNE_LAB_CONTEXT,
  type SettingsSection,
} from "./provider/context.ts";
export { default as RuneProvider } from "./RuneProvider.svelte";
export {
  type AppData,
  type AppStore,
  createAppStore,
  getAppStore,
} from "./reactivity/app.svelte.ts";
// Reactivity & Context exports
export { useCell } from "./reactivity/use-cell.svelte.ts";
export { default as SettingsFields } from "./settings/SettingsFields.svelte";

import pkgConfig from "../deno.json" with { type: "json" };
export const version = (): string => pkgConfig.version;
