import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import MoneyDisplay from "./MoneyDisplay.svelte";
import { RUNE_LAB_CONTEXT } from "@internal/state";

// Mock stores for context
const mockCurrencyStore = {
  current: "USD",
  get: (code: string) => ({ symbol: "$", decimals: 2 }),
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
      props: { amount: 125.50, unit: "major", currency: "USD" },
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
});
