import { describe, expect, it } from "vite-plus/test";
import { toSnapshot } from "dinero.js";
import {
  convertAmount,
  convertMoney,
  createMoney,
  CURRENCY_MAP,
  formatAmount,
  fromMoneySnapshot,
  registerCurrency,
  scaledRate,
  toAdyenMoney,
  toMinorUnit,
  toMoneySnapshot,
  toPaypalMoney,
  toSquareMoney,
  toStripeMoney,
} from "@rune-lab/money";

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

  describe("Exchange Rates & Conversion", () => {
    describe("scaledRate()", () => {
      it("should convert float to ScaledRate with default precision", () => {
        expect(scaledRate(17.23)).toEqual({ amount: 172300, scale: 4 });
      });

      it("should use custom precision", () => {
        expect(scaledRate(0.89, 2)).toEqual({ amount: 89, scale: 2 });
      });

      it("should handle integer rates", () => {
        expect(scaledRate(1199, 0)).toEqual({ amount: 1199, scale: 0 });
      });
    });

    describe("convertMoney()", () => {
      it("should convert USD to MXN", () => {
        const usd = createMoney(100, "USD");
        const rates = { MXN: scaledRate(20) };
        const mxn = convertMoney(usd, "MXN", rates);
        const snapshot = toSnapshot(mxn);
        expect(snapshot.amount).toBe(20000000);
        expect(snapshot.scale).toBe(6);
        expect(snapshot.currency.code).toBe("MXN");
      });

      it("should throw for unknown target currency", () => {
        const usd = createMoney(100, "USD");
        expect(() => convertMoney(usd, "UNKNOWN", {})).toThrow();
      });

      it("should throw for missing rate", () => {
        const usd = createMoney(100, "USD");
        expect(() => convertMoney(usd, "MXN", {})).toThrow();
      });
    });

    describe("convertAmount()", () => {
      it("should return same amount if codes match", () => {
        expect(convertAmount(100, "USD", "USD", {})).toBe(100);
      });

      it("should convert minor units correctly", () => {
        const rates = { MXN: scaledRate(20) };
        expect(convertAmount(100, "USD", "MXN", rates)).toBe(2000);
      });
    });
  });

  describe("Payment Provider Helpers", () => {
    it("toStripeMoney should return lowercase currency and amount", () => {
      const money = createMoney(150, "USD");
      expect(toStripeMoney(money)).toEqual({ amount: 150, currency: "usd" });
    });

    it("toPaypalMoney should return decimal string and uppercase code", () => {
      const money = createMoney(150, "USD");
      expect(toPaypalMoney(money)).toEqual({
        value: "1.50",
        currency_code: "USD",
      });
    });

    it("toAdyenMoney should return amount and uppercase code", () => {
      const money = createMoney(150, "USD");
      expect(toAdyenMoney(money)).toEqual({ value: 150, currency: "USD" });
    });

    it("toSquareMoney should return bigint amount and code", () => {
      const money = createMoney(150, "USD");
      expect(toSquareMoney(money)).toEqual({
        amount: BigInt(150),
        currency: "USD",
      });
    });
  });

  describe("Snapshots", () => {
    it("should round-trip to/from money snapshot", () => {
      const money = createMoney(123, "MXN");
      const snapshot = toMoneySnapshot(money);
      expect(snapshot).toEqual({ amount: 123, currency: "MXN", scale: 2 });

      const restored = fromMoneySnapshot(snapshot);
      expect(toSnapshot(restored)).toEqual(toSnapshot(money));
    });

    it("should preserve elevated scale", () => {
      const money = createMoney(123, "USD");
      const snapshot = { amount: 12345, currency: "USD", scale: 4 };
      const restored = fromMoneySnapshot(snapshot);
      expect(toSnapshot(restored).scale).toBe(4);
    });
  });
});
