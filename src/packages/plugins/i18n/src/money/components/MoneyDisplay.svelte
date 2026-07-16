<script lang="ts">
import { getCurrencyStore, getLanguageStore } from "../../mod.ts";
import { DEV } from "esm-env";
import {
  formatAmount,
  type ISO4217Code,
  toMinorUnit,
} from "../primitives/money.ts";
import type { MoneyPrimitive } from "../primitives/money-primitive.ts";

let {
  amount: amountProp,
  money,
  unit = "minor",
  fallback = "—",
  currency,
  sourceCurrency,
  showSourceCurrency = false,
  noRatesFallback,
  locale,
  compact = false,
} = $props<{
  amount?: number | null | undefined;
  money?: MoneyPrimitive;
  unit?: "major" | "minor";
  fallback?: string;
  currency?: ISO4217Code | string;
  sourceCurrency?: ISO4217Code | string;
  showSourceCurrency?: boolean;
  noRatesFallback?: string;
  locale?: string;
  compact?: boolean;
}>();

$effect(() => {
  if (DEV && money && unit !== "minor") {
    console.warn(
      "[MoneyDisplay] The `unit` prop is deprecated when using `money: MoneyPrimitive`. " +
        "The unit is derived from the MoneyPrimitive instance.",
    );
  }
});

const amount = $derived(money ? money.minor : amountProp);
const effectiveSourceCurrency = $derived(
  money ? money.currencyCode : sourceCurrency,
);

const currencyStore = getCurrencyStore();
const languageStore = getLanguageStore();

const resolvedDisplayCurrency = $derived(
  currency ?? String(currencyStore.current),
);

const resolvedSourceCurrency = $derived(
  effectiveSourceCurrency ?? resolvedDisplayCurrency,
);

const resolvedLocale = $derived(
  locale ?? (String(languageStore.current) || "en"),
);

const currencyMeta = $derived(currencyStore.get(resolvedDisplayCurrency));
const decimals = $derived(currencyMeta?.decimals ?? 2);

const formatted = $derived.by(() => {
  if (
    amount === null ||
    amount === undefined ||
    (typeof amount === "number" && isNaN(amount))
  ) {
    return fallback;
  }

  const minorAmount = unit === "major"
    ? toMinorUnit(Number(amount), resolvedSourceCurrency)
    : amount;

  let displayAmount = Number(minorAmount);
  let displayCurrency = resolvedDisplayCurrency;

  if (resolvedSourceCurrency !== resolvedDisplayCurrency) {
    if (currencyStore.canConvert) {
      displayAmount = currencyStore.convertAmount(
        Number(minorAmount),
        resolvedSourceCurrency,
        resolvedDisplayCurrency,
      );
    } else if (noRatesFallback) {
      return noRatesFallback;
    } else {
      displayCurrency = resolvedSourceCurrency;
    }
  }

  if (compact) {
    const displayDecimals = currencyStore.get(displayCurrency)?.decimals ?? 2;
    const majorUnits = displayAmount / 10 ** displayDecimals;
    return new Intl.NumberFormat(resolvedLocale, {
      style: "currency",
      currency: displayCurrency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(majorUnits);
  }

  return formatAmount(displayAmount, displayCurrency, resolvedLocale);
});
</script>

<data value={amount} class="rl-money-display tabular-nums">
  {formatted}
  {#if showSourceCurrency && sourceCurrency &&
  sourceCurrency !== resolvedDisplayCurrency}
    <small class="opacity-50 ml-1">({sourceCurrency})</small>
  {/if}
</data>
