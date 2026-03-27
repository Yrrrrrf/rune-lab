import { describe, expect, it } from "vite-plus/test";
import { createCurrencyStore } from "./currency.svelte.ts";

describe("Currency Store", () => {
  it("should have prototype methods from ConfigStore", () => {
    const store = createCurrencyStore();

    // These come from the ConfigStore class prototype
    expect(typeof store.get).toBe("function");
    expect(typeof store.set).toBe("function");
    expect(typeof store.getProp).toBe("function");
    expect(typeof store.addItems).toBe("function");

    // These are instance properties
    expect(store.current).toBeDefined();
    expect(Array.isArray(store.available)).toBe(true);

    // This is the extension method
    expect(typeof store.addCurrency).toBe("function");
  });

  it("should correctly use prototype methods", () => {
    const store = createCurrencyStore();
    const usd = store.get("USD" as never);

    expect(usd).toBeDefined();
    expect(usd?.code).toBe("USD");
    expect(usd?.symbol).toBe("$");
  });

  it("should add a new currency and keep methods", () => {
    const store = createCurrencyStore();
    store.addCurrency({ code: "BTC", symbol: "₿", decimals: 8 });

    const btc = store.get("BTC" as never);
    expect(btc).toBeDefined();
    expect(btc?.code).toBe("BTC");
    expect(btc?.decimals).toBe(8);

    // Methods still exist after interaction
    expect(typeof store.get).toBe("function");
    expect(typeof store.set).toBe("function");
  });
});
