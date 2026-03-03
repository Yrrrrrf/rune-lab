export * from "@internal/core";
export * from "@internal/state";
export * from "@internal/ui";

export {
  cookieDriver,
  localStorageDriver,
  sessionStorageDriver,
} from "@internal/state";

import pkg from "../package.json" with { type: "json" };
export const version = (): string => pkg.version;
