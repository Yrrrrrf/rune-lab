import { describe, expect, it, vi } from "vite-plus/test";

// Mock esm-env before importing the module
vi.mock("esm-env", () => ({ DEV: true }));

import {
  batchResolveMessages,
  createMessageResolver,
  hasMessage,
} from "./message-resolver.ts";

describe("MessageResolver", () => {
  const mockMessages = {
    usd: () => "US Dollar",
    eur: () => "Euro",
    mxn: () => "Mexican Peso",
    jpy: () => "Japanese Yen",
  };

  describe("createMessageResolver", () => {
    it("should resolve a key via keyExtractor", () => {
      const resolver = createMessageResolver<{ code: string }>(mockMessages, {
        keyExtractor: (opt) => opt.code,
        keyTransformer: (key) => key.toLowerCase(),
      });

      expect(resolver({ code: "USD" })).toBe("US Dollar");
      expect(resolver({ code: "EUR" })).toBe("Euro");
    });

    it("should use untransformed key when no transformer provided", () => {
      const resolver = createMessageResolver<{ code: string }>(mockMessages, {
        keyExtractor: (opt) => opt.code,
      });

      // Without transformer, keys must match exactly
      expect(resolver({ code: "usd" })).toBe("US Dollar");
    });

    it("should fall back to the raw key for missing translations", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const resolver = createMessageResolver<{ code: string }>(mockMessages, {
        keyExtractor: (opt) => opt.code,
        keyTransformer: (key) => key.toLowerCase(),
      });

      const result = resolver({ code: "UNKNOWN" });
      expect(result).toBe("UNKNOWN"); // falls back to original key
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Missing translation"),
      );

      warnSpy.mockRestore();
    });
  });

  describe("hasMessage", () => {
    it("should return true for existing keys", () => {
      expect(hasMessage(mockMessages, "usd")).toBe(true);
      expect(hasMessage(mockMessages, "eur")).toBe(true);
    });

    it("should return false for missing keys", () => {
      expect(hasMessage(mockMessages, "UNKNOWN")).toBe(false);
      expect(hasMessage(mockMessages, "")).toBe(false);
    });
  });

  describe("batchResolveMessages", () => {
    it("should resolve all options at once", () => {
      const options = [{ code: "USD" }, { code: "EUR" }, { code: "MXN" }];

      const result = batchResolveMessages(mockMessages, options, {
        keyExtractor: (opt) => opt.code,
        keyTransformer: (key) => key.toLowerCase(),
      });

      expect(result).toEqual({
        USD: "US Dollar",
        EUR: "Euro",
        MXN: "Mexican Peso",
      });
    });

    it("should include fallback values for missing keys", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});

      const options = [{ code: "USD" }, { code: "XYZ" }];
      const result = batchResolveMessages(mockMessages, options, {
        keyExtractor: (opt) => opt.code,
        keyTransformer: (key) => key.toLowerCase(),
      });

      expect(result).toEqual({
        USD: "US Dollar",
        XYZ: "XYZ", // fallback
      });

      vi.restoreAllMocks();
    });
  });
});
