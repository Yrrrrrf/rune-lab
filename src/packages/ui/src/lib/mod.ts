export * from "@rune-lab/core";
export * from "./kernel/src/mod.ts";
// export * from "../../../plugins/i18n/src/lang/messages.ts";
// export * from "../../../plugins/i18n/src/lang/message-resolver.ts";

export { default as RuneProvider } from "./RuneProvider.svelte";

import pkgConfig from "../../deno.json" with { type: "json" };
export const version = (): string => pkgConfig.version;
