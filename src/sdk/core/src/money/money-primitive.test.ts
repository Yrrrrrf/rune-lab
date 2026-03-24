import { describe, expect, it } from "vitest";
import { MoneyPrimitive } from "./money-primitive.ts";
import { registerCurrency } from "./money.ts";

describe("MoneyPrimitive", () => {
    describe("Construction", () => {
        it("should create from minor units", () => {
            const money = MoneyPrimitive.fromMinor(1299, "USD");
            expect(money.amount).toBe(1299);
            expect(money.currencyCode).toBe("USD");
            expect(money.scale).toBe(2);
        });

        it("should create from major units", () => {
            const money = MoneyPrimitive.fromMajor(12.99, "USD");
            expect(money.amount).toBe(1299);
            expect(money.currencyCode).toBe("USD");
            expect(money.scale).toBe(2);
        });

        it("should round fractional minor units", () => {
            const money = MoneyPrimitive.fromMajor(12.999, "USD");
            expect(money.amount).toBe(1300); // rounded
        });

        it("should throw for unknown currency", () => {
            expect(() => MoneyPrimitive.fromMinor(100, "UNKNOWN"))
                .toThrow("Unknown currency code");
        });
    });

    describe("JPY (exponent 0)", () => {
        it("should handle zero-exponent currencies", () => {
            const yen = MoneyPrimitive.fromMinor(5000, "JPY");
            expect(yen.minor).toBe(5000);
            expect(yen.major).toBe(5000); // no decimal shift for JPY
            expect(yen.scale).toBe(0);
        });

        it("should create from major with no decimal shift", () => {
            const yen = MoneyPrimitive.fromMajor(5000, "JPY");
            expect(yen.amount).toBe(5000);
        });
    });

    describe("BHD (exponent 3)", () => {
        it("should handle 3-exponent currencies", () => {
            const BHD = { code: "BHD", base: 10, exponent: 3 };
            registerCurrency("BHD", BHD);

            const dinar = MoneyPrimitive.fromMajor(1.234, "BHD");
            expect(dinar.amount).toBe(1234);
            expect(dinar.major).toBe(1.234);
            expect(dinar.scale).toBe(3);
        });
    });

    describe("Getters", () => {
        it(".minor returns the raw amount", () => {
            const money = MoneyPrimitive.fromMinor(1500, "USD");
            expect(money.minor).toBe(1500);
        });

        it(".major returns the human-readable float", () => {
            const money = MoneyPrimitive.fromMinor(1500, "USD");
            expect(money.major).toBe(15.0);
        });

        it(".major handles MXN (exponent 2)", () => {
            const money = MoneyPrimitive.fromMinor(25050, "MXN");
            expect(money.major).toBe(250.5);
        });
    });

    describe("Formatting", () => {
        it("should format USD in en-US", () => {
            const money = MoneyPrimitive.fromMinor(1299, "USD");
            expect(money.format("en-US")).toMatch(/\$12\.99/);
        });

        it("should format MXN in es-MX", () => {
            const money = MoneyPrimitive.fromMinor(25050, "MXN");
            expect(money.format("es-MX")).toMatch(/\$250\.50/);
        });

        it("should format JPY with no decimals", () => {
            const money = MoneyPrimitive.fromMinor(5000, "JPY");
            const formatted = money.format("ja-JP");
            expect(formatted).toMatch(/5,000/);
        });
    });

    describe("Arithmetic (immutability)", () => {
        it("add returns a new instance", () => {
            const a = MoneyPrimitive.fromMinor(1000, "USD");
            const b = MoneyPrimitive.fromMinor(500, "USD");
            const result = a.add(b);

            expect(result.amount).toBe(1500);
            expect(result).not.toBe(a); // new instance
            expect(a.amount).toBe(1000); // original unchanged
        });

        it("subtract returns a new instance", () => {
            const a = MoneyPrimitive.fromMinor(1000, "USD");
            const b = MoneyPrimitive.fromMinor(300, "USD");
            const result = a.subtract(b);

            expect(result.amount).toBe(700);
            expect(a.amount).toBe(1000);
        });

        it("multiply returns a new instance", () => {
            const money = MoneyPrimitive.fromMinor(1000, "USD");
            const result = money.multiply(2.5);

            expect(result.amount).toBe(2500);
            expect(money.amount).toBe(1000);
        });

        it("multiply rounds correctly", () => {
            const money = MoneyPrimitive.fromMinor(100, "USD");
            const result = money.multiply(0.33);

            expect(result.amount).toBe(33);
        });

        it("throws on currency mismatch for add", () => {
            const usd = MoneyPrimitive.fromMinor(100, "USD");
            const eur = MoneyPrimitive.fromMinor(100, "EUR");

            expect(() => usd.add(eur)).toThrow("Currency mismatch");
        });

        it("throws on currency mismatch for subtract", () => {
            const usd = MoneyPrimitive.fromMinor(100, "USD");
            const eur = MoneyPrimitive.fromMinor(100, "EUR");

            expect(() => usd.subtract(eur)).toThrow("Currency mismatch");
        });
    });

    describe("Comparison", () => {
        it("equals returns true for identical values", () => {
            const a = MoneyPrimitive.fromMinor(1000, "USD");
            const b = MoneyPrimitive.fromMinor(1000, "USD");
            expect(a.equals(b)).toBe(true);
        });

        it("equals returns false for different amounts", () => {
            const a = MoneyPrimitive.fromMinor(1000, "USD");
            const b = MoneyPrimitive.fromMinor(2000, "USD");
            expect(a.equals(b)).toBe(false);
        });

        it("equals returns false for different currencies", () => {
            const a = MoneyPrimitive.fromMinor(1000, "USD");
            const b = MoneyPrimitive.fromMinor(1000, "EUR");
            expect(a.equals(b)).toBe(false);
        });

        it("isZero returns true for zero amount", () => {
            expect(MoneyPrimitive.fromMinor(0, "USD").isZero()).toBe(true);
        });

        it("isZero returns false for non-zero", () => {
            expect(MoneyPrimitive.fromMinor(1, "USD").isZero()).toBe(false);
        });

        it("isNegative works correctly", () => {
            expect(MoneyPrimitive.fromMinor(-100, "USD").isNegative()).toBe(true);
            expect(MoneyPrimitive.fromMinor(0, "USD").isNegative()).toBe(false);
            expect(MoneyPrimitive.fromMinor(100, "USD").isNegative()).toBe(false);
        });
    });

    describe("Serialization (JSON round-trip)", () => {
        it("should round-trip standard currency", () => {
            const original = MoneyPrimitive.fromMinor(1299, "USD");
            const json = original.toJSON();

            expect(json).toEqual({
                amount: 1299,
                currencyCode: "USD",
                scale: 2,
            });

            const restored = MoneyPrimitive.fromJSON(json);
            expect(restored.equals(original)).toBe(true);
        });

        it("should round-trip JPY", () => {
            const original = MoneyPrimitive.fromMinor(5000, "JPY");
            const json = original.toJSON();
            const restored = MoneyPrimitive.fromJSON(json);

            expect(restored.amount).toBe(5000);
            expect(restored.scale).toBe(0);
            expect(restored.equals(original)).toBe(true);
        });

        it("should round-trip through JSON.stringify/parse", () => {
            const original = MoneyPrimitive.fromMajor(42.50, "EUR");
            const serialized = JSON.stringify(original);
            const parsed = JSON.parse(serialized);
            const restored = MoneyPrimitive.fromJSON(parsed);

            expect(restored.equals(original)).toBe(true);
        });

        it("toString returns a debug-friendly string", () => {
            const money = MoneyPrimitive.fromMinor(1299, "USD");
            expect(money.toString()).toBe("MoneyPrimitive(1299 USD scale=2)");
        });
    });
});
