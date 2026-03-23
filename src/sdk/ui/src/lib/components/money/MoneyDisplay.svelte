<script lang="ts">
    import { getLanguageStore, getCurrencyStore } from "@internal/state";
    import { formatAmount, toMinorUnit, type ISO4217Code } from "@internal/core";

    let {
        amount,
        unit = 'minor',
        fallback = "—",
        currency,
        sourceCurrency,
        showSourceCurrency = false,
        noRatesFallback,
        locale,
        compact = false,
    } = $props<{
        /** Amount in minor or major units (see unit prop) */
        amount: number | null | undefined;
        /** 
         * Whether the amount is in 'major' (e.g., pesos) or 'minor' (e.g., centavos) units.
         * Defaults to 'minor' for backward compatibility.
         */
        unit?: 'major' | 'minor';
        /** String to display if amount is null, undefined, or NaN. Defaults to "—" */
        fallback?: string;
        /** Override currency code (defaults to CurrencyStore.current) */
        currency?: ISO4217Code | string;
        /** The currency the amount is stored in (e.g. MXN) */
        sourceCurrency?: ISO4217Code | string;
        /** Show the original currency as a label */
        showSourceCurrency?: boolean;
        /** Fallback text if conversion is needed but rates are missing */
        noRatesFallback?: string;
        /** Override locale (defaults to LanguageStore.current) */
        locale?: string;
        /** Use compact notation (e.g., $1.2M) */
        compact?: boolean;
    }>();

    const currencyStore = getCurrencyStore();
    const languageStore = getLanguageStore();

    const resolvedDisplayCurrency = $derived(
        currency ?? String(currencyStore.current),
    );

    const resolvedSourceCurrency = $derived(
        sourceCurrency ?? resolvedDisplayCurrency
    );

    const resolvedLocale = $derived(
        locale ?? (String(languageStore.current) || "en"),
    );

    const currencyMeta = $derived(currencyStore.get(resolvedDisplayCurrency));
    const decimals = $derived(currencyMeta?.decimals ?? 2);

    const formatted = $derived.by(() => {
        // If amount is null/undefined/NaN, use fallback
        if (amount === null || amount === undefined || (typeof amount === 'number' && isNaN(amount))) {
            return fallback;
        }

        // Convert to minor units if necessary (in source currency)
        const minorAmount = unit === 'major' 
            ? toMinorUnit(Number(amount), resolvedSourceCurrency) 
            : amount;

        // Conversion logic
        let displayAmount = Number(minorAmount);
        let displayCurrency = resolvedDisplayCurrency;

        if (resolvedSourceCurrency !== resolvedDisplayCurrency) {
            if (currencyStore.canConvert) {
                displayAmount = currencyStore.convertAmount(Number(minorAmount), resolvedSourceCurrency, resolvedDisplayCurrency);
            } else if (noRatesFallback) {
                return noRatesFallback;
            } else {
                // Fallback to source currency display if rates missing
                displayCurrency = resolvedSourceCurrency;
            }
        }

        if (compact) {
            const displayDecimals = currencyStore.get(displayCurrency)?.decimals ?? 2;
            const majorUnits = displayAmount / Math.pow(10, displayDecimals);
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
    {#if showSourceCurrency && sourceCurrency && sourceCurrency !== resolvedDisplayCurrency}
        <small class="opacity-50 ml-1">({sourceCurrency})</small>
    {/if}
</data>
