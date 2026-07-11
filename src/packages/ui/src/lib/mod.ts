export * from "@rune-lab/core";
export * from "./context.ts";
export * from "./app.svelte.ts";
export * from "./persistence/drivers.ts";
export * from "./persistence/provider.ts";
export * from "./persistence/usePersistence.ts";
export * from "./persistence/createConfigStore.svelte.ts";
export * from "./actions/portal.ts";
export * from "./cells.svelte.ts";
// export * from "../../../plugins/i18n/src/lang/messages.ts";
// export * from "../../../plugins/i18n/src/lang/message-resolver.ts";

export { default as RuneProvider } from "./RuneProvider.svelte";

import pkgConfig from "../../deno.json" with { type: "json" };
export const version = (): string => pkgConfig.version;
