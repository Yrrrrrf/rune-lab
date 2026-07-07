export { default as RuneProvider } from "./RuneProvider.svelte";
export * from "@rune-lab/core";
export * from "./kernel/src/mod.ts";
export * from "./i18n/messages.ts";
export * from "./i18n/message-resolver.ts";

import pkgConfig from "../../deno.json" with { type: "json" };
export const version = (): string => pkgConfig.version;
