<script lang="ts">
    import AppSettingSelector from "./AppSettingSelector.svelte";
    import {
        getCurrencyStore,
        type Currency,
    } from "$lib/state/currency.svelte";
    import * as rlMessages from "$lib/paraglide/messages.js";
    import { getContext } from "svelte";

    const currencyStore = getCurrencyStore();

    let {
        codes = [],
        current = $bindable(String(currencyStore.current)),
        onchange,
    }: {
        codes?: string[];
        current?: string;
        onchange?: (value: string) => void;
    } = $props();

    const userDictionary =
        getContext<Record<string, any>>("rl:dictionary") ?? {};

    function getLabel(currency: Currency): string {
        const key = String(currency.code);
        if (typeof userDictionary[key] === "function")
            return userDictionary[key]();
        if (typeof (rlMessages as any)[key] === "function")
            return (rlMessages as any)[key]();
        return String(currency.code);
    }

    let active = $derived(
        currencyStore.get(currencyStore.current) ?? currencyStore.available[0],
    );

    let available = $derived(
        codes.length > 0
            ? currencyStore.available.filter((c) => codes.includes(c.code))
            : currencyStore.available,
    );
</script>

<AppSettingSelector
    value={active}
    options={available}
    tooltip={getLabel(active)}
>
    {#snippet triggerLabel()}
        <span class="font-bold">{active.symbol}</span>
    {/snippet}

    {#snippet item(c)}
        <button
            class="flex items-center gap-3 w-full"
            onclick={() => {
                currencyStore.set(c.code);
                current = c.code;
                onchange?.(c.code);
            }}
        >
            <span class="badge badge-sm badge-ghost w-8">{c.symbol}</span>
            <span>{getLabel(c)}</span>
        </button>
    {/snippet}
</AppSettingSelector>
