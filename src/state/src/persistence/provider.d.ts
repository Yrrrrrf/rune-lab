import type { PersistenceDriver } from "@rune-lab/core";
/**
 * Resolves a driver input (function or instance) into a concrete PersistenceDriver.
 * If the input is null/undefined, returns an inMemoryDriver as the Null Object.
 *
 * This is the single place where function-form drivers are unwrapped.
 */
export declare function resolveDriver(
  driver?:
    | PersistenceDriver
    | (() => PersistenceDriver | undefined)
    | undefined,
): PersistenceDriver;
/**
 * Sets the persistence driver context at the RuneProvider root.
 * Should be called exactly once, before any store factories run.
 *
 * @param driver - A PersistenceDriver instance, a factory function, or undefined.
 *                 Undefined falls back to inMemoryDriver.
 */
export declare function setDriverContext(
  driver?: PersistenceDriver | (() => PersistenceDriver | undefined),
): PersistenceDriver;
/**
 * Retrieves the persistence driver from context.
 * Always returns a concrete PersistenceDriver — never null or undefined.
 *
 * @throws Error if called outside a RuneProvider tree (no context set).
 */
export declare function getDriverContext(): PersistenceDriver;
