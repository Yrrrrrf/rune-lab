import { describe, expect, it } from "vitest";
import {
    CONVERSION_STRATEGIES,
    directConversion,
    inverseConversion,
    resolveRate,
    triangularConversion,
} from "./strategies.ts";

describe("ConversionStrategies", () => {
    describe("resolveRate", () => {
        it("should pass through plain numbers", () => {
            expect(resolveRate(20)).toBe(20);
        });

        it("should resolve ScaledRate to float", () => {
            expect(resolveRate({ amount: 172300, scale: 4 })).toBeCloseTo(17.23);
        });

        it("should handle zero scale", () => {
            expect(resolveRate({ amount: 1199, scale: 0 })).toBe(1199);
        });
    });

    describe("directConversion", () => {
        it("should multiply amount by rate", () => {
            // 100 USD cents * 20 = 2000 MXN centavos
            expect(directConversion(100, 20)).toBe(2000);
        });

        it("should handle fractional rates", () => {
            // 100 * 0.91 = 91
            expect(directConversion(100, 0.91)).toBe(91);
        });

        it("should handle zero amount", () => {
            expect(directConversion(0, 20)).toBe(0);
        });

        it("should handle negative amounts", () => {
            expect(directConversion(-100, 20)).toBe(-2000);
        });

        it("should handle large numbers", () => {
            expect(directConversion(1_000_000, 20)).toBe(20_000_000);
        });

        it("should round to nearest integer", () => {
            // 100 * 17.23 = 1723
            expect(directConversion(100, 17.23)).toBe(1723);
        });
    });

    describe("inverseConversion", () => {
        it("should divide amount by rate", () => {
            // 2000 MXN / 20 = 100 USD
            expect(inverseConversion(2000, 20)).toBe(100);
        });

        it("should handle fractional results (rounded)", () => {
            // 100 / 3 ≈ 33.33 → 33
            expect(inverseConversion(100, 3)).toBe(33);
        });

        it("should throw on zero rate", () => {
            expect(() => inverseConversion(100, 0)).toThrow("rate of zero");
        });

        it("should handle negative amounts", () => {
            expect(inverseConversion(-2000, 20)).toBe(-100);
        });

        it("should handle zero amount", () => {
            expect(inverseConversion(0, 20)).toBe(0);
        });
    });

    describe("triangularConversion", () => {
        it("should convert through base: MXN → USD → EUR", () => {
            // 2000 MXN, 1 USD = 20 MXN, 1 USD = 0.91 EUR
            // 2000 / 20 = 100 USD → 100 * 0.91 = 91 EUR
            expect(triangularConversion(2000, 20, 0.91)).toBe(91);
        });

        it("should handle zero amount", () => {
            expect(triangularConversion(0, 20, 0.91)).toBe(0);
        });

        it("should throw when source-to-base rate is zero", () => {
            expect(() => triangularConversion(100, 0, 0.91)).toThrow("source-to-base rate is zero");
        });

        it("should handle large cross-rates", () => {
            // 1000 BRL, 1 USD = 5 BRL, 1 USD = 150 JPY
            // 1000 / 5 = 200 USD → 200 * 150 = 30000 JPY
            expect(triangularConversion(1000, 5, 150)).toBe(30000);
        });

        it("should handle negative amounts", () => {
            expect(triangularConversion(-2000, 20, 0.91)).toBe(-91);
        });
    });

    describe("CONVERSION_STRATEGIES registry", () => {
        it("should have direct, inverse, and triangular strategies", () => {
            expect(CONVERSION_STRATEGIES).toHaveProperty("direct");
            expect(CONVERSION_STRATEGIES).toHaveProperty("inverse");
            expect(CONVERSION_STRATEGIES).toHaveProperty("triangular");
        });

        it("direct strategy matches standalone function", () => {
            expect(CONVERSION_STRATEGIES["direct"](100, 20)).toBe(directConversion(100, 20));
        });

        it("inverse strategy matches standalone function", () => {
            expect(CONVERSION_STRATEGIES["inverse"](2000, 20)).toBe(inverseConversion(2000, 20));
        });

        it("triangular strategy matches standalone function", () => {
            expect(CONVERSION_STRATEGIES["triangular"](2000, 20, 0.91))
                .toBe(triangularConversion(2000, 20, 0.91));
        });

        it("should be extensible", () => {
            CONVERSION_STRATEGIES["custom"] = (amount: number, rate: number) =>
                Math.round(amount * rate * 1.01); // 1% fee

            expect(CONVERSION_STRATEGIES["custom"](100, 20)).toBe(2020);

            // Clean up
            delete CONVERSION_STRATEGIES["custom"];
        });
    });
});
