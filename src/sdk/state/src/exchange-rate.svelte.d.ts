import { type RateMap, type ScaledRate } from "@internal/core";
export declare class ExchangeRateStore {
  #private;
  /**
   * The current exchange rates relative to the base currency.
   */
  get rates(): RateMap;
  /**
   * The base currency all rates are relative to.
   */
  get baseCurrency(): string;
  /**
   * Returns true if exchange rates have been loaded.
   */
  get hasRates(): boolean;
  /**
   * Set exchange rates from a human-readable float map.
   * @param base - The base currency code (e.g., "USD")
   * @param rawRates - A map of currency codes to float rates (e.g., { MXN: 17.23 })
   */
  setRates(base: string, rawRates: Record<string, number>): void;
  /**
   * Directly set pre-scaled rates.
   */
  setScaledRates(base: string, rates: RateMap): void;
  /**
   * Resolves the exchange rate between two currencies.
   * Returns a ScaledRate representing how many units of toCode are in 1 unit of fromCode.
   */
  getRate(fromCode: string, toCode: string): ScaledRate | number | undefined;
  /**
   * Internal conversion logic that handles triangulation through base currency.
   * Delegates all math to ConversionStrategies (directConversion, inverseConversion, triangularConversion).
   */
  convertAmount(amount: number, fromCode: string, toCode: string): number;
}
/**
 * Factory to create the ExchangeRateStore.
 */
export declare function createExchangeRateStore(): ExchangeRateStore;
/**
 * Consumer to retrieve the ExchangeRateStore from context.
 */
export declare function getExchangeRateStore(): ExchangeRateStore;
