<!--
  MoneyInput — Monetary value input that works in minor units (cents).
  No floats cross the boundary — values are always integer minor units.
-->
<script module lang="ts">
    export interface MoneyInputProps {
        /** Current value in minor units (e.g., 15000 = $150.00) */
        value?: number;
        /** Override currency code (defaults to CurrencyStore.current) */
        currency?: string;
        /** Minimum value in minor units */
        min?: number;
        /** Maximum value in minor units */
        max?: number;
        /** Placeholder text */
        placeholder?: string;
        /** Fired when the value changes (in minor units) */
        oninput?: (cents: number) => void;
        /** Input disabled state */
        disabled?: boolean;
    }
</script>

<script lang="ts">
    import { getCurrencyStore } from "@internal/state";

    let {
        value = 0,
        currency,
        min,
        max,
        placeholder = "0.00",
        oninput,
        disabled = false,
    }: MoneyInputProps = $props();

    const currencyStore = getCurrencyStore();

    const resolvedCurrency = $derived(
        currency ?? String(currencyStore.current),
    );

    // M-02 parallel: derive symbol/decimals from resolved currency, not store current
    const currencyMeta = $derived(currencyStore.get(resolvedCurrency));
    const symbol = $derived(currencyMeta?.symbol ?? "$");
    const decimals = $derived(currencyMeta?.decimals ?? 2);

    // Convert minor units → display string
    const displayValue = $derived.by(() => {
        if (decimals === 0) return String(value);
        const divisor = Math.pow(10, decimals);
        return (value / divisor).toFixed(decimals);
    });

    /**
     * M-03 FIX: Parse user input to minor units using string-based integer parsing
     * to avoid floating-point precision traps (e.g., 1.005 * 100 = 100.49999...)
     */
    function handleInput(e: Event) {
        const target = e.target as HTMLInputElement;
        const raw = target.value.replace(/[^0-9.,-]/g, "");

        if (!raw) return;

        // String-based parsing: split on decimal point
        const parts = raw.split(".");
        const integerPart = parts[0] || "0";

        // Pad or truncate the fractional part to exactly `decimals` digits
        let fractionalPart = (parts[1] || "").slice(0, decimals);
        fractionalPart = fractionalPart.padEnd(decimals, "0");

        // Combine as integer minor units — no floats involved
        const combined =
            decimals === 0 ? integerPart : integerPart + fractionalPart;

        let cents = parseInt(combined, 10);
        if (isNaN(cents)) return;

        if (min !== undefined) cents = Math.max(cents, min);
        if (max !== undefined) cents = Math.min(cents, max);

        value = cents;
        oninput?.(cents);
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
        aria-label={`Amount in ${resolvedCurrency}`}
    />
    <span class="text-base-content/30 text-xs font-mono select-none"
        >{resolvedCurrency}</span
    >
</label>
