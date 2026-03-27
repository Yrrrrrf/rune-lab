// sdk/state/src/persistence/provider.ts
// Context-based persistence driver injection.
// Resolves the driver once (handling function-vs-instance duality)
// and guarantees a concrete PersistenceDriver is always available.

import { getContext, setContext } from "svelte";
import type { PersistenceDriver } from "../mod.ts";
import { createInMemoryDriver } from "./drivers.ts";

const DRIVER_CONTEXT_KEY = Symbol("rl:driver-provider");

/**
 * Resolves a driver input (function or instance) into a concrete PersistenceDriver.
 * If the input is null/undefined, returns an inMemoryDriver as the Null Object.
 *
 * This is the single place where function-form drivers are unwrapped.
 */
export function resolveDriver(
  driver?:
    | PersistenceDriver
    | (() => PersistenceDriver | undefined)
    | undefined,
): PersistenceDriver {
  const resolved = typeof driver === "function" ? driver() : driver;
  return resolved ?? createInMemoryDriver();
}

/**
 * Sets the persistence driver context at the RuneProvider root.
 * Should be called exactly once, before any store factories run.
 *
 * @param driver - A PersistenceDriver instance, a factory function, or undefined.
 *                 Undefined falls back to inMemoryDriver.
 */
export function setDriverContext(
  driver?: PersistenceDriver | (() => PersistenceDriver | undefined),
): PersistenceDriver {
  const resolved = resolveDriver(driver);
  setContext(DRIVER_CONTEXT_KEY, resolved);
  return resolved;
}

/**
 * Retrieves the persistence driver from context.
 * Always returns a concrete PersistenceDriver — never null or undefined.
 *
 * @throws Error if called outside a RuneProvider tree (no context set).
 */
export function getDriverContext(): PersistenceDriver {
  const driver = getContext<PersistenceDriver | undefined>(DRIVER_CONTEXT_KEY);
  if (!driver) {
    throw new Error(
      "[DriverProvider] getDriverContext() called outside a <RuneProvider> tree. " +
        "Wrap your application in <RuneProvider> to provide persistence.",
    );
  }
  return driver;
}
