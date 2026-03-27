import { describe, expect, it } from "vite-plus/test";
import { currencyStore } from "./currency.svelte.ts";

describe("Currency Store", () => {
  it("should have prototype methods from ConfigStore", () => {
    // These come from the ConfigStore class prototype
    expect(typeof currencyStore.get).toBe("function");
    expect(typeof currencyStore.set).toBe("function");
    expect(typeof currencyStore.getProp).toBe("function");
    expect(typeof currencyStore.addItems).toBe("function");

    // These are instance properties
    expect(currencyStore.current).toBeDefined();
    expect(Array.isArray(currencyStore.available)).toBe(true);

    // This is the extension method
    expect(typeof currencyStore.addCurrency).toBe("function");
  });

  it("should correctly use prototype methods", () => {
    const usd = currencyStore.get("USD" as never);

    expect(usd).toBeDefined();
    expect(usd?.code).toBe("USD");
    expect(usd?.symbol).toBe("$");
  });

  it("should add a new currency and keep methods", () => {
    currencyStore.addCurrency({ code: "BTC", symbol: "₿", decimals: 8 });

    const btc = currencyStore.get("BTC" as never);
    expect(btc).toBeDefined();
    expect(btc?.code).toBe("BTC");
    expect(btc?.decimals).toBe(8);

    // Methods still exist after interaction
    expect(typeof currencyStore.get).toBe("function");
    expect(typeof currencyStore.set).toBe("function");
  });
});
