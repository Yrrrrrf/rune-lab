import { describe, expect, it } from "vitest";
import { toSnapshot } from "dinero.js";
import {
  createMoney,
  CURRENCY_MAP,
  formatAmount,
  registerCurrency,
  toMinorUnit,
} from "./money";

describe("Money Core Utilities", () => {
  describe("safeAmount()", () => {
    it("should return 0 for null and undefined", () => {
      // testing internal private function via public wrapper createMoney
      expect(toSnapshot(createMoney(null, "USD")).amount).toBe(0);
      expect(toSnapshot(createMoney(undefined, "USD")).amount).toBe(0);
    });

    it("should return finite numbers unchanged", () => {
      expect(toSnapshot(createMoney(1234, "USD")).amount).toBe(1234);
    });

    it("should return 0 for NaN and Infinity", () => {
      expect(toSnapshot(createMoney(NaN, "USD")).amount).toBe(0);
      expect(toSnapshot(createMoney(Infinity, "USD")).amount).toBe(0);
    });

    it("should handle bigints", () => {
      expect(toSnapshot(createMoney(BigInt(5000), "USD")).amount).toBe(5000);
    });

    it("should handle objects with toString (SurrealDB Decimal)", () => {
      const decimal = { toString: () => "123.45" };
      expect(toSnapshot(createMoney(decimal, "USD")).amount).toBe(123); // Math.round(123.45) = 123
    });

    it("should handle numeric strings", () => {
      expect(toSnapshot(createMoney("999", "USD")).amount).toBe(999);
    });
  });

  describe("toMinorUnit()", () => {
    it("should convert major to minor for MXN (exponent 2)", () => {
      expect(toMinorUnit(12900000, "MXN")).toBe(1290000000);
    });

    it("should convert major to minor for JPY (exponent 0)", () => {
      expect(toMinorUnit(5000, "JPY")).toBe(5000);
    });

    it("should throw for unknown currency", () => {
      expect(() => toMinorUnit(100, "UNKNOWN")).toThrow();
    });
  });

  describe("registerCurrency()", () => {
    it("should allow registering a new currency and creating money with it", () => {
      const KWD = { code: "KWD", base: 10, exponent: 3 };
      registerCurrency("KWD", KWD);

      expect(CURRENCY_MAP["KWD"]).toEqual(KWD);

      const money = createMoney(1000, "KWD");
      expect(toSnapshot(money).currency.code).toBe("KWD");
    });
  });

  describe("formatAmount()", () => {
    it("should format minor units correctly for USD", () => {
      // $1.50
      expect(formatAmount(150, "USD", "en-US")).toMatch(/\$1\.50/);
    });

    it("should format minor units correctly for MXN", () => {
      // MX$1.50 or $1.50 depending on locale
      expect(formatAmount(150, "MXN", "es-MX")).toMatch(/\$1\.50/);
    });
  });
});
