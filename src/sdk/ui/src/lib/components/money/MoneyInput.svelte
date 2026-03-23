<!--
  MoneyInput — Monetary value input that works in minor units (cents).
  No floats cross the boundary — values are always integer minor units.
-->
<script module lang="ts">
    import type { ISO4217Code } from "@internal/core";

    export interface MoneyInputProps {
        /** Current value in minor or major units (see unit prop) */
        amount?: number | null | undefined;
        /** 
         * Whether the amount is in 'major' (e.g., pesos) or 'minor' (e.g., centavos) units.
         * Defaults to 'minor' for backward compatibility.
         */
        unit?: 'major' | 'minor';
        /** Override currency code (defaults to CurrencyStore.current) */
        currency?: ISO4217Code | string;
        /** Minimum value in same units as amount */
        min?: number;
        /** Maximum value in same units as amount */
        max?: number;
        /** Placeholder text */
        placeholder?: string;
        /** Fired when the value changes (unit matches the unit prop) */
        oninput?: (val: number) => void;
        /** Input disabled state */
        disabled?: boolean;
    }
</script>

<script lang="ts">
    import { getCurrencyStore } from "@internal/state";
    import { toMinorUnit } from "@internal/core";

    let {
        amount = $bindable(0),
        unit = 'minor',
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

    const currencyMeta = $derived(currencyStore.get(resolvedCurrency));
    const symbol = $derived(currencyMeta?.symbol ?? "$");
    const decimals = $derived(currencyMeta?.decimals ?? 2);

    // Convert to minor units internally for consistent arithmetic if needed, 
    // but here we just need to display it.
    const displayValue = $derived.by(() => {
        const val = amount ?? 0;
        if (unit === 'major') {
            return Number(val).toFixed(decimals);
        }
        if (decimals === 0) return String(val);
        const divisor = Math.pow(10, decimals);
        return (Number(val) / divisor).toFixed(decimals);
    });

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

        // Apply constraints in minor units
        let finalCents = cents;
        
        if (unit === 'major') {
            // If we are working in major units, we need to convert min/max to cents for comparison
            const minCents = min !== undefined ? toMinorUnit(min, resolvedCurrency) : undefined;
            const maxCents = max !== undefined ? toMinorUnit(max, resolvedCurrency) : undefined;
            
            if (minCents !== undefined) finalCents = Math.max(finalCents, minCents);
            if (maxCents !== undefined) finalCents = Math.min(finalCents, maxCents);
            
            const majorValue = finalCents / Math.pow(10, decimals);
            amount = majorValue;
            oninput?.(majorValue);
        } else {
            if (min !== undefined) finalCents = Math.max(finalCents, min);
            if (max !== undefined) finalCents = Math.min(finalCents, max);
            
            amount = finalCents;
            oninput?.(finalCents);
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
        aria-label={`Amount in ${resolvedCurrency}`}
    />
    <span class="text-base-content/30 text-xs font-mono select-none"
        >{resolvedCurrency}</span
    >
</label>
