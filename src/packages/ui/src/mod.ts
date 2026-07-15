export * from "@rune-lab/core";
export * from "./actions/portal.ts";
export * from "./app.svelte.ts";
export * from "./cells.svelte.ts";
export * from "./context.ts";
export { createPluginKit } from "./define/plugin-kit.ts";
export * from "./persistence/createConfigStore.svelte.ts";
export * from "./persistence/drivers.ts";
export * from "./persistence/provider.ts";
export * from "./persistence/usePersistence.ts";
export { default as RuneProvider } from "./RuneProvider.svelte";
export { default as SettingsFields } from "./settings/SettingsFields.svelte";

import pkgConfig from "../deno.json" with { type: "json" };
export const version = (): string => pkgConfig.version;
