export * from "@internal/core";
export * from "@internal/state";
export * from "@internal/ui";
export * from "@internal/auth";

import pkg from "../package.json" with { type: "json" };
export const version = (): string => pkg.version;
