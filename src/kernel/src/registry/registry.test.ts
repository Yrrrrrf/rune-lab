import { beforeEach, describe, expect, it } from "vite-plus/test";
import type { PersistenceDriver } from "../persistence/types.ts";
import {
  clearRegistry,
  getAllRegisteredStores,
  getRegisteredStore,
  registerStore,
  STORE_REGISTRY,
  unregisterStore,
} from "./mod.ts";

describe("StoreRegistry", () => {
  // Clean slate for each test
  beforeEach(() => {
    clearRegistry();
  });

  describe("registerStore", () => {
    it("should register a store entry", () => {
      registerStore({
        id: "test",
        factory: () => ({ value: 42 }),
      });

      expect(STORE_REGISTRY.size).toBe(1);
      expect(STORE_REGISTRY.has("test")).toBe(true);
    });

    it("should allow overwriting with a warning", () => {
      registerStore({ id: "test", factory: () => "v1" });
      registerStore({ id: "test", factory: () => "v2" });

      expect(STORE_REGISTRY.size).toBe(1);
      const entry = getRegisteredStore("test");
      // Factory should be the second one
      expect(
        entry?.factory(
          {} as Record<string, unknown>,
          {} as PersistenceDriver,
          new Map(),
        ),
      ).toBe("v2");
    });

    it("should register multiple entries", () => {
      registerStore({ id: "a", factory: () => "A" });
      registerStore({ id: "b", factory: () => "B" });
      registerStore({ id: "c", factory: () => "C" });

      expect(STORE_REGISTRY.size).toBe(3);
    });
  });

  describe("getRegisteredStore", () => {
    it("should return the entry for a registered key", () => {
      registerStore({
        id: "theme",
        factory: () => "theme-store",
        optional: false,
      });

      const entry = getRegisteredStore("theme");
      expect(entry).toBeDefined();
      expect(entry!.id).toBe("theme");
      expect(entry!.optional).toBe(false);
    });

    it("should return undefined for unregistered keys", () => {
      expect(getRegisteredStore("nonexistent")).toBeUndefined();
    });
  });

  describe("getAllRegisteredStores", () => {
    it("should return all registered stores", () => {
      registerStore({ id: "a", factory: () => "A" });
      registerStore({ id: "b", factory: () => "B" });

      const all = getAllRegisteredStores();
      expect(all.size).toBe(2);
      expect(all.has("a")).toBe(true);
      expect(all.has("b")).toBe(true);
    });
  });

  describe("unregisterStore", () => {
    it("should remove a registered store", () => {
      registerStore({ id: "test", factory: () => "val" });
      expect(STORE_REGISTRY.has("test")).toBe(true);

      const result = unregisterStore("test");
      expect(result).toBe(true);
      expect(STORE_REGISTRY.has("test")).toBe(false);
    });

    it("should return false for non-existent keys", () => {
      expect(unregisterStore("nope")).toBe(false);
    });
  });

  describe("clearRegistry", () => {
    it("should remove all entries", () => {
      registerStore({ id: "a", factory: () => "A" });
      registerStore({ id: "b", factory: () => "B" });
      expect(STORE_REGISTRY.size).toBe(2);

      clearRegistry();
      expect(STORE_REGISTRY.size).toBe(0);
    });
  });

  describe("StoreFactory contract", () => {
    it("factory receives config and driver, returns store", () => {
      const mockDriver: PersistenceDriver = {
        get: () => null,
        set: () => {},
        remove: () => {},
      };

      registerStore<
        Record<string, unknown>,
        { type: string; hasDriver: boolean; apiUrl: unknown }
      >(
        {
          id: "analytics",
          factory: (config, driver) => ({
            type: "analytics",
            hasDriver: !!driver,
            apiUrl: config.apiUrl,
          }),
          optional: true,
          noPersistence: true,
        },
      );

      const entry = getRegisteredStore("analytics")!;
      const store = entry.factory({ apiUrl: "test" }, mockDriver, new Map());

      expect(store).toEqual({
        type: "analytics",
        hasDriver: true,
        apiUrl: "test",
      });
    });

    it("optional factory can return null", () => {
      registerStore({
        id: "optional-feature",
        factory: () => null,
        optional: true,
      });

      const entry = getRegisteredStore("optional-feature")!;
      expect(
        entry.factory(
          {} as Record<string, unknown>,
          {} as PersistenceDriver,
          new Map(),
        ),
      ).toBeNull();
    });
  });
});
