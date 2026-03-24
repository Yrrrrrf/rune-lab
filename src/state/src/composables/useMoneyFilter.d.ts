export interface MoneyFilterOptions {
  min?: number;
  max?: number;
  unit?: "major" | "minor";
  autoConvertOnChange?: boolean;
}
/**
 * A reactive currency-aware filter composable.
 * Handles min/max thresholds that auto-convert when the display currency changes.
 */
export declare function useMoneyFilter(options?: MoneyFilterOptions): {
  min: number;
  max: number;
  readonly displayMin: string;
  readonly displayMax: string;
  setMin: (value: number) => void;
  setMax: (value: number) => void;
  reset: () => void;
  matches: (amount: number, entityCurrency: string) => boolean;
};
