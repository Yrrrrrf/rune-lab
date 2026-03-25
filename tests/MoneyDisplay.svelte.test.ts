import { render, screen } from "@testing-library/svelte";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vite-plus/test";
import MoneyDisplay from "./MoneyDisplay.svelte";
import { RUNE_LAB_CONTEXT } from "@rune-lab/state";

// Mock stores for context
const mockCurrencyStore = {
  current: "USD",
  get: (code: string) => {
    if (code === "JPY") return { symbol: "¥", decimals: 0 };
    if (code === "MXN") return { symbol: "$", decimals: 2 };
    return { symbol: "$", decimals: 2 };
  },
  canConvert: true,
  convertAmount: (amount, from, to) => {
    if (from === "USD" && to === "MXN") return amount * 20;
    if (from === "MXN" && to === "USD") return amount / 20;
    return amount;
  },
};

const mockLanguageStore = {
  current: "en-US",
};

const context = new Map<any, any>([
  [RUNE_LAB_CONTEXT.currency, mockCurrencyStore],
  [RUNE_LAB_CONTEXT.language, mockLanguageStore],
]);

describe("MoneyDisplay.svelte", () => {
  it("renders fallback when amount is null", () => {
    render(MoneyDisplay, {
      props: { amount: null, fallback: "N/A" },
      context,
    });
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("renders fallback when amount is undefined", () => {
    render(MoneyDisplay, {
      props: { amount: undefined, fallback: "N/A" },
      context,
    });
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("renders fallback when amount is NaN", () => {
    render(MoneyDisplay, {
      props: { amount: NaN, fallback: "N/A" },
      context,
    });
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("renders default fallback when amount is NaN and no fallback prop provided", () => {
    render(MoneyDisplay, {
      props: { amount: NaN },
      context,
    });
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders zero correctly when passed literal 0", () => {
    render(MoneyDisplay, {
      props: { amount: 0 },
      context,
    });
    expect(screen.getByText(/\$0\.00/)).toBeInTheDocument();
  });

  it('handles unit="major"', () => {
    render(MoneyDisplay, {
      props: { amount: 125.5, unit: "major", currency: "USD" },
      context,
    });
    expect(screen.getByText(/\$125\.50/)).toBeInTheDocument();
  });

  it('handles unit="minor" (default)', () => {
    render(MoneyDisplay, {
      props: { amount: 12550, unit: "minor", currency: "USD" },
      context,
    });
    expect(screen.getByText(/\$125\.50/)).toBeInTheDocument();
  });

  it("supports compact notation", () => {
    render(MoneyDisplay, {
      props: { amount: 1200000, unit: "major", currency: "USD", compact: true },
      context,
    });
    expect(screen.getByText(/\$1\.2M/)).toBeInTheDocument();
  });

  it("converts from sourceCurrency to current display currency", () => {
    // 2000 MXN -> 100 USD
    render(MoneyDisplay, {
      props: { amount: 2000, unit: "major", sourceCurrency: "MXN" },
      context,
    });
    expect(screen.getByText(/\$100\.00/)).toBeInTheDocument();
  });

  it("shows source currency label when showSourceCurrency is true", () => {
    render(MoneyDisplay, {
      props: {
        amount: 2000,
        unit: "major",
        sourceCurrency: "MXN",
        showSourceCurrency: true,
      },
      context,
    });
    expect(screen.getByText("(MXN)")).toBeInTheDocument();
  });

  it("falls back to source currency when conversion is impossible", () => {
    const contextNoConvert = new Map(context);
    contextNoConvert.set(RUNE_LAB_CONTEXT.currency, {
      ...mockCurrencyStore,
      canConvert: false,
    });

    render(MoneyDisplay, {
      props: { amount: 2000, unit: "major", sourceCurrency: "MXN" },
      context: contextNoConvert,
    });
    // Should show $2,000.00 (MXN)
    expect(screen.getByText(/\$2,000\.00/)).toBeInTheDocument();
  });
});
