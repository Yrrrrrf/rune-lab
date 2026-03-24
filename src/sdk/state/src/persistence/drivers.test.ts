import { describe, expect, it } from "vitest";
import { createInMemoryDriver, inMemoryDriver } from "./drivers.ts";

describe("PersistenceDriver Contract Tests", () => {
    describe("createInMemoryDriver (factory)", () => {
        it("should return null for missing keys", () => {
            const driver = createInMemoryDriver();
            expect(driver.get("nonexistent")).toBeNull();
        });

        it("should set and get a value", () => {
            const driver = createInMemoryDriver();
            driver.set("key", "value");
            expect(driver.get("key")).toBe("value");
        });

        it("should overwrite existing values", () => {
            const driver = createInMemoryDriver();
            driver.set("key", "v1");
            driver.set("key", "v2");
            expect(driver.get("key")).toBe("v2");
        });

        it("should remove a key", () => {
            const driver = createInMemoryDriver();
            driver.set("key", "value");
            driver.remove("key");
            expect(driver.get("key")).toBeNull();
        });

        it("should not throw when removing a nonexistent key", () => {
            const driver = createInMemoryDriver();
            expect(() => driver.remove("nonexistent")).not.toThrow();
        });

        it("should handle empty string values", () => {
            const driver = createInMemoryDriver();
            driver.set("key", "");
            expect(driver.get("key")).toBe("");
        });

        it("should handle JSON string values", () => {
            const driver = createInMemoryDriver();
            const json = JSON.stringify({ theme: "dark", fontSize: 14 });
            driver.set("settings", json);
            expect(JSON.parse(driver.get("settings")!)).toEqual({
                theme: "dark",
                fontSize: 14,
            });
        });
    });

    describe("Factory isolation", () => {
        it("should create isolated instances (no cross-contamination)", () => {
            const driverA = createInMemoryDriver();
            const driverB = createInMemoryDriver();

            driverA.set("shared-key", "fromA");
            driverB.set("shared-key", "fromB");

            expect(driverA.get("shared-key")).toBe("fromA");
            expect(driverB.get("shared-key")).toBe("fromB");
        });

        it("remove on one instance does not affect another", () => {
            const driverA = createInMemoryDriver();
            const driverB = createInMemoryDriver();

            driverA.set("key", "valueA");
            driverB.set("key", "valueB");

            driverA.remove("key");

            expect(driverA.get("key")).toBeNull();
            expect(driverB.get("key")).toBe("valueB");
        });
    });

    describe("inMemoryDriver singleton", () => {
        it("should implement the full PersistenceDriver interface", () => {
            expect(typeof inMemoryDriver.get).toBe("function");
            expect(typeof inMemoryDriver.set).toBe("function");
            expect(typeof inMemoryDriver.remove).toBe("function");
        });

        it("should function as a working driver", () => {
            // Use unique keys to avoid test interference
            const key = `test-${Date.now()}`;
            inMemoryDriver.set(key, "singleton-value");
            expect(inMemoryDriver.get(key)).toBe("singleton-value");
            inMemoryDriver.remove(key);
            expect(inMemoryDriver.get(key)).toBeNull();
        });
    });
});
