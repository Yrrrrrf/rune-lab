<script lang="ts">
    import { getLanguageStore, getCurrencyStore } from "@internal/state";
    import { formatAmount, toMinorUnit, type ISO4217Code } from "@internal/core";

    let {
        amount,
        unit = 'minor',
        fallback = "—",
        currency,
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
        /** Override locale (defaults to LanguageStore.current) */
        locale?: string;
        /** Use compact notation (e.g., $1.2M) */
        compact?: boolean;
    }>();

    const currencyStore = getCurrencyStore();
    const languageStore = getLanguageStore();

    const resolvedCurrency = $derived(
        currency ?? String(currencyStore.current),
    );

    const resolvedLocale = $derived(
        locale ?? (String(languageStore.current) || "en"),
    );

    const currencyMeta = $derived(currencyStore.get(resolvedCurrency));
    const decimals = $derived(currencyMeta?.decimals ?? 2);

    const formatted = $derived.by(() => {
        // If amount is null/undefined/NaN, use fallback
        if (amount === null || amount === undefined || (typeof amount === 'number' && isNaN(amount))) {
            return fallback;
        }

        // Convert to minor units if necessary
        const minorAmount = unit === 'major' 
            ? toMinorUnit(Number(amount), resolvedCurrency) 
            : amount;

        if (compact) {
            const majorUnits = Number(minorAmount) / Math.pow(10, decimals);
            return new Intl.NumberFormat(resolvedLocale, {
                style: "currency",
                currency: resolvedCurrency,
                notation: "compact",
                maximumFractionDigits: 1,
            }).format(majorUnits);
        }

        return formatAmount(minorAmount, resolvedCurrency, resolvedLocale);
    });
</script>

<data value={amount} class="rl-money-display tabular-nums">{formatted}</data>
