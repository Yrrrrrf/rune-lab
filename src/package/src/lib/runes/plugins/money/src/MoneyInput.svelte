<script module lang="ts">
    import type { ISO4217Code } from "./mod.ts";
    import { MoneyPrimitive } from "./mod.ts";

    export interface MoneyInputProps {
        /** Current value in minor or major units (see unit prop) */
        amount?: number | null | undefined;
        /**
         * MoneyPrimitive instance. When provided, initial amount and currency
         * are derived from the primitive. Read-only input — output still fires oninput().
         */
        money?: MoneyPrimitive;
        /**
         * Whether the amount is in 'major' (e.g., pesos) or 'minor' (e.g., centavos) units.
         * @deprecated Use `money` prop with MoneyPrimitive instead.
         * Defaults to 'minor' for backward compatibility.
         */
        unit?: "major" | "minor";
        /** Override currency code (defaults to CurrencyStore.current) */
        currency?: ISO4217Code | string;
        /** The currency the amount is stored in (e.g. MXN) */
        storageCurrency?: ISO4217Code | string;
        /** Minimum value in same units as amount (in storageCurrency) */
        min?: number;
        /** Maximum value in same units as amount (in storageCurrency) */
        max?: number;
        /** Placeholder text */
        placeholder?: string;
        /** Fired when the value changes (unit matches the unit prop, in storageCurrency) */
        oninput?: (val: number) => void;
        /** Input disabled state */
        disabled?: boolean;
    }
</script>

<script lang="ts">
    import { getCurrencyStore } from "../../../../kernel/src/mod.ts";
    import { toMinorUnit } from "./mod.ts";
    import { DEV } from "esm-env";

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

    // Dev warning for deprecated usage
    $effect(() => {
        if (DEV && money && unit !== "minor") {
            console.warn(
                "[MoneyInput] The `unit` prop is deprecated when using `money: MoneyPrimitive`. " +
                    "The unit is derived from the MoneyPrimitive instance.",
            );
        }
    });

    // Seed initial values from MoneyPrimitive if provided
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

    // The display value is reactive to amount (which is in storage currency)
    const displayValue = $derived.by(() => {
        let val = amount ?? 0;

        // If storage !== display, convert for display
        if (
            resolvedStorageCurrency !== resolvedDisplayCurrency &&
            currencyStore.canConvert
        ) {
            const minorAmount =
                unit === "major"
                    ? toMinorUnit(val, resolvedStorageCurrency)
                    : val;
            const convertedMinor = currencyStore.convertAmount(
                Number(minorAmount),
                resolvedStorageCurrency,
                resolvedDisplayCurrency,
            );

            if (decimals === 0) return String(Math.round(convertedMinor));
            return (convertedMinor / Math.pow(10, decimals)).toFixed(decimals);
        }

        // Standard display (no conversion or no rates)
        if (unit === "major") {
            return Number(val).toFixed(decimals);
        }
        if (decimals === 0) return String(val);
        const divisor = Math.pow(10, decimals);
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

        // String-based parsing: split on decimal point
        const parts = raw.split(".");
        const integerPart = parts[0] || "0";

        // Pad or truncate the fractional part to exactly `decimals` digits
        let fractionalPart = (parts[1] || "").slice(0, decimals);
        fractionalPart = fractionalPart.padEnd(decimals, "0");

        // Combine as integer minor units (in display currency)
        const combined =
            decimals === 0 ? integerPart : integerPart + fractionalPart;

        let displayCents = parseInt(combined, 10);
        if (isNaN(displayCents)) return;

        // Convert back to storage currency
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

        // Apply constraints in storage currency minor units
        let finalStorageCents = storageCents;

        const storageDecimals =
            currencyStore.get(resolvedStorageCurrency)?.decimals ?? 2;
        const minCents =
            min !== undefined
                ? unit === "major"
                    ? toMinorUnit(min, resolvedStorageCurrency)
                    : min
                : undefined;
        const maxCents =
            max !== undefined
                ? unit === "major"
                    ? toMinorUnit(max, resolvedStorageCurrency)
                    : max
                : undefined;

        if (minCents !== undefined)
            finalStorageCents = Math.max(finalStorageCents, minCents);
        if (maxCents !== undefined)
            finalStorageCents = Math.min(finalStorageCents, maxCents);

        if (unit === "major") {
            const majorValue =
                finalStorageCents / Math.pow(10, storageDecimals);
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
    <span class="text-base-content/30 text-xs font-mono select-none"
        >{resolvedDisplayCurrency}</span
    >
</label>
