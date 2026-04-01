export { default as RuneProvider } from "./RuneProvider.svelte";
// export { default as Icon } from "./Icon.svelte";

export * from "@rune-lab/kernel";
export * from "@rune-lab/layout";
export * from "@rune-lab/palettes";
export * from "@rune-lab/money";

import pkgConfig from "../../package.json" with { type: "json" };
export const version = (): string => pkgConfig.version;
