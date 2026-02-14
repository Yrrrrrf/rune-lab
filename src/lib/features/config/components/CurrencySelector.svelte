<script lang="ts">
    import AppSettingSelector from "./AppSettingSelector.svelte";
    import { currencyStore, type Currency } from "../stores/currency.svelte";
    import * as m from "../../../paraglide/messages.js";
    import { createMessageResolver } from "$lib/devtools/message-resolver";

    let { codes = [] }: { codes?: string[] } = $props();

    const getLabel = createMessageResolver<Currency>(m as any, {
        keyExtractor: (c) => c.code,
    });

    let active = $derived(
        currencyStore.get(currencyStore.current) ?? currencyStore.available[0],
    );

    let available = $derived(
        codes.length > 0 
            ? currencyStore.available.filter(c => codes.includes(c.code))
            : currencyStore.available
    );
</script>

<AppSettingSelector value={active} options={available}>
    {#snippet triggerLabel(c)}
        <span class="font-bold">{c.symbol}</span>
        <span class="uppercase font-medium text-xs tracking-wide">{c.code}</span
        >
    {/snippet}

    {#snippet item(c)}
        <button
            class="flex justify-between items-center w-full"
            onclick={() => currencyStore.set(c.code)}
        >
            <span>{getLabel(c)}</span>
            <span class="badge badge-sm badge-ghost">{c.symbol}</span>
        </button>
    {/snippet}
</AppSettingSelector>
