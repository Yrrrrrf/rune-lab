import { describe, expect, it, vi } from "vite-plus/test";
import { currencyStore, setExchangeRateStore } from "./currency.svelte.ts";
import { ExchangeRateStore } from "./exchange-rate.svelte.ts";

vi.mock("../use/useMoney.ts", () => ({
  useMoney: () => ({
    format: (amount: number, code?: string) => `${amount} ${code ?? "USD"}`,
  }),
}));

describe("ExchangeRateStore", () => {
  it("should initialize with default base", () => {
    const store = new ExchangeRateStore();
    expect(store.baseCurrency).toBe("USD");
    expect(store.hasRates).toBe(false);
  });

  it("should set and retrieve rates", () => {
    const store = new ExchangeRateStore();
    store.setRates("USD", { MXN: 17.23, EUR: 0.91 });

    expect(store.hasRates).toBe(true);
    expect(store.baseCurrency).toBe("USD");

    const rateToMxn = store.getRate("USD", "MXN");
    expect(rateToMxn).toEqual({ amount: 17230000, scale: 6 });
  });

  it("should handle inverse rates", () => {
    const store = new ExchangeRateStore();
    store.setRates("USD", { MXN: 20 });

    const rateToBase = store.getRate("MXN", "USD");
    expect(rateToBase).toEqual({ amount: 5000000, scale: 8 });
  });

  it("should handle triangulation (cross-rates)", () => {
    const store = new ExchangeRateStore();
    store.setRates("USD", { MXN: 20, EUR: 0.5 });

    const rateMxnToEur = store.getRate("MXN", "EUR");
    expect(rateMxnToEur).toEqual({ amount: 2500000, scale: 8 });
  });
});

describe("CurrencyStore Integration", () => {
  it("should convert amount when ExchangeRateStore is wired", () => {
    const exchangeRateStore = new ExchangeRateStore();
    exchangeRateStore.setRates("USD", { MXN: 20 });

    setExchangeRateStore(exchangeRateStore);

    expect(currencyStore.canConvert).toBe(true);

    const converted = currencyStore.convertAmount(10000, "USD", "MXN");
    expect(converted).toBe(200000);
  });

  it("should return original amount if no rates available", () => {
    const exchangeRateStore = new ExchangeRateStore();
    setExchangeRateStore(exchangeRateStore);

    expect(currencyStore.canConvert).toBe(false);

    const converted = currencyStore.convertAmount(10000, "USD", "MXN");
    expect(converted).toBe(10000);
  });
});

describe("useMoneyFilter", () => {
  it("matches() should work with conversion", () => {
    const exchangeRateStore = new ExchangeRateStore();
    exchangeRateStore.setRates("USD", { MXN: 20 });

    setExchangeRateStore(exchangeRateStore);

    const amountInMxn = 1000000; // 10,000 MXN
    const amountInUsd = currencyStore.convertAmount(amountInMxn, "MXN", "USD");
    expect(amountInUsd).toBe(50000); // 500 USD
  });
});
