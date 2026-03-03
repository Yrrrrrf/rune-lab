<!--
  MoneyDisplay — Renders a monetary amount with locale-aware formatting.
  Uses CurrencyStore + LanguageStore from context for defaults.
  Zero domain knowledge.
-->
<script module lang="ts">
    export interface MoneyDisplayProps {
        /** Amount in minor units (e.g., 15000 = $150.00 for USD) */
        amount: number;
        /** Override currency code (defaults to CurrencyStore.current) */
        currency?: string;
        /** Override locale (defaults to LanguageStore.current) */
        locale?: string;
        /** Use compact notation (e.g., $150K) */
        compact?: boolean;
    }
</script>

<script lang="ts">
    import { getLanguageStore, getCurrencyStore } from "@internal/state";
    import { formatAmount } from "@internal/core";

    let {
        amount,
        currency,
        locale,
        compact = false,
    }: MoneyDisplayProps = $props();

    const currencyStore = getCurrencyStore();
    const languageStore = getLanguageStore();

    const resolvedCurrency = $derived(
        currency ?? String(currencyStore.current),
    );

    const resolvedLocale = $derived(
        locale ?? (String(languageStore.current) || "en"),
    );

    // M-02 FIX: Derive decimals from the RESOLVED currency, not the store's current
    const currencyMeta = $derived(currencyStore.get(resolvedCurrency));
    const decimals = $derived(currencyMeta?.decimals ?? 2);

    const formatted = $derived.by(() => {
        if (compact) {
            const majorUnits = amount / Math.pow(10, decimals);
            return new Intl.NumberFormat(resolvedLocale, {
                style: "currency",
                currency: resolvedCurrency,
                notation: "compact",
                maximumFractionDigits: 1,
            }).format(majorUnits);
        }
        return formatAmount(amount, resolvedCurrency, resolvedLocale);
    });
</script>

<data value={amount} class="rl-money-display tabular-nums">{formatted}</data>
