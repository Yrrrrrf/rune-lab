<script module lang="ts">
import type { ISO4217Code } from "../primitives/money.ts";
import type { MoneyPrimitive } from "../primitives/money-primitive.ts";

export interface MoneyInputProps {
  amount?: number | null | undefined;
  money?: MoneyPrimitive;
  unit?: "major" | "minor";
  currency?: ISO4217Code | string;
  storageCurrency?: ISO4217Code | string;
  min?: number;
  max?: number;
  placeholder?: string;
  oninput?: (val: number) => void;
  disabled?: boolean;
}
</script>

<script lang="ts">
import { DEV } from "esm-env";
import { getCurrencyStore } from "../../accessors.ts";
import { toMinorUnit } from "../primitives/money.ts";

let {
  amount = $bindable(0),
  money,
  unit = "minor",
  currency,
  storageCurrency,
  min,
  max,
  placeholder = "0.00",
  oninput,
  disabled = false,
}: MoneyInputProps = $props();

const currencyStore = getCurrencyStore();

$effect(() => {
  if (DEV && money && unit !== "minor") {
    console.warn(
      "[MoneyInput] The `unit` prop is deprecated when using `money: MoneyPrimitive`. " +
        "The unit is derived from the MoneyPrimitive instance.",
    );
  }
});

$effect(() => {
  if (money && amount === 0) {
    amount = money.minor;
  }
});

const resolvedDisplayCurrency = $derived(
  money?.currencyCode ?? currency ?? String(currencyStore.current),
);

const resolvedStorageCurrency = $derived(
  storageCurrency ?? money?.currencyCode ?? resolvedDisplayCurrency,
);

const displayMeta = $derived(currencyStore.get(resolvedDisplayCurrency));
const symbol = $derived(displayMeta?.symbol ?? "$");
const decimals = $derived(displayMeta?.decimals ?? 2);

const displayValue = $derived.by(() => {
  let val = amount ?? 0;

  if (
    resolvedStorageCurrency !== resolvedDisplayCurrency &&
    currencyStore.canConvert
  ) {
    const minorAmount = unit === "major"
      ? toMinorUnit(val, resolvedStorageCurrency)
      : val;
    const convertedMinor = currencyStore.convertAmount(
      Number(minorAmount),
      resolvedStorageCurrency,
      resolvedDisplayCurrency,
    );

    if (decimals === 0) return String(Math.round(convertedMinor));
    return (convertedMinor / 10 ** decimals).toFixed(decimals);
  }

  if (unit === "major") {
    return Number(val).toFixed(decimals);
  }
  if (decimals === 0) return String(val);
  const divisor = 10 ** decimals;
  return (Number(val) / divisor).toFixed(decimals);
});

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement;
  const raw = target.value.replace(/[^0-9.,-]/g, "");

  if (!raw) {
    amount = 0;
    oninput?.(0);
    return;
  }

  const parts = raw.split(".");
  const integerPart = parts[0] || "0";

  let fractionalPart = (parts[1] || "").slice(0, decimals);
  fractionalPart = fractionalPart.padEnd(decimals, "0");

  const combined = decimals === 0 ? integerPart : integerPart + fractionalPart;

  let displayCents = parseInt(combined, 10);
  if (isNaN(displayCents)) return;

  let storageCents = displayCents;
  if (
    resolvedStorageCurrency !== resolvedDisplayCurrency &&
    currencyStore.canConvert
  ) {
    storageCents = currencyStore.convertAmount(
      displayCents,
      resolvedDisplayCurrency,
      resolvedStorageCurrency,
    );
  }

  let finalStorageCents = storageCents;

  const storageDecimals =
    currencyStore.get(resolvedStorageCurrency)?.decimals ?? 2;
  const minCents = min !== undefined
    ? unit === "major" ? toMinorUnit(min, resolvedStorageCurrency) : min
    : undefined;
  const maxCents = max !== undefined
    ? unit === "major" ? toMinorUnit(max, resolvedStorageCurrency) : max
    : undefined;

  if (minCents !== undefined) {
    finalStorageCents = Math.max(finalStorageCents, minCents);
  }
  if (maxCents !== undefined) {
    finalStorageCents = Math.min(finalStorageCents, maxCents);
  }

  if (unit === "major") {
    const majorValue = finalStorageCents / 10 ** storageDecimals;
    amount = majorValue;
    oninput?.(majorValue);
  } else {
    amount = finalStorageCents;
    oninput?.(finalStorageCents);
  }
}
</script>

<label
  class="input input-bordered flex items-center gap-1"
  class:input-disabled={disabled}
>
  <span class="text-base-content/50 font-medium select-none">{symbol}</span>
  <input
    type="text"
    inputmode="decimal"
    class="grow bg-transparent outline-none tabular-nums"
    value={displayValue}
    {placeholder}
    {disabled}
    oninput={handleInput}
    aria-label={`Amount in ${resolvedDisplayCurrency}`}
  />
  <span class="text-base-content/30 text-xs font-mono select-none">{
    resolvedDisplayCurrency
  }</span>
</label>
