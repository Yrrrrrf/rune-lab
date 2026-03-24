import { describe, expect, it } from "vite-plus/test";
import { resolveDriver } from "./provider.ts";
import type { PersistenceDriver } from "@internal/core";

describe("DriverProvider", () => {
  describe("resolveDriver", () => {
    it("should return inMemoryDriver when given undefined", () => {
      const driver = resolveDriver(undefined);
      expect(driver).toBeDefined();
      expect(typeof driver.get).toBe("function");
      expect(typeof driver.set).toBe("function");
      expect(typeof driver.remove).toBe("function");
    });

    it("should pass through a concrete PersistenceDriver", () => {
      const mockDriver: PersistenceDriver = {
        get: () => null,
        set: () => {},
        remove: () => {},
      };
      const driver = resolveDriver(mockDriver);
      expect(driver).toBe(mockDriver);
    });

    it("should resolve a factory function to a concrete driver", () => {
      const mockDriver: PersistenceDriver = {
        get: () => null,
        set: () => {},
        remove: () => {},
      };
      const driver = resolveDriver(() => mockDriver);
      expect(driver).toBe(mockDriver);
    });

    it("should fall back to inMemoryDriver when factory returns undefined", () => {
      const driver = resolveDriver(() => undefined);
      expect(driver).toBeDefined();
      expect(typeof driver.get).toBe("function");
    });

    it("inMemoryDriver fallback should be functional", () => {
      const driver = resolveDriver(undefined);
      driver.set("test-key", "test-value");
      expect(driver.get("test-key")).toBe("test-value");
      driver.remove("test-key");
      expect(driver.get("test-key")).toBeNull();
    });

    it("should create isolated inMemoryDriver instances per call", () => {
      const driverA = resolveDriver(undefined);
      const driverB = resolveDriver(undefined);
      driverA.set("key", "A");
      driverB.set("key", "B");
      expect(driverA.get("key")).toBe("A");
      expect(driverB.get("key")).toBe("B");
    });
  });
});
