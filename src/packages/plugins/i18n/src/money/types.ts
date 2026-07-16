export {
  addMoney,
  convertAmount,
  convertMoney,
  createMoney,
  CURRENCY_MAP,
  type Dinero,
  type DineroCurrency,
  type DineroSnapshot,
  formatAmount,
  formatMoney,
  fromMoneySnapshot,
  type ISO4217Code,
  multiplyMoney,
  type RateMap,
  registerCurrency,
  safeAmount,
  type ScaledRate,
  scaledRate,
  subtractMoney,
  toAdyenMoney,
  toMinorUnit,
  toMoneySnapshot,
  toPaypalMoney,
  toSquareMoney,
  toStripeMoney,
} from "./primitives/money.ts";

export interface Currency {
  code: string;
  symbol: string;
  decimals: number;
}
