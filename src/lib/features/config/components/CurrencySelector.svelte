<script lang="ts">
    import AppSettingSelector from "./AppSettingSelector.svelte";
    import { currencyStore, type Currency } from "$lib/state/currency.svelte";
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

<AppSettingSelector 
    value={active} 
    options={available}
    tooltip={getLabel(active)}
>
    {#snippet triggerLabel(c)}
        <span class="font-bold">{c.symbol}</span>
    {/snippet}

    {#snippet item(c)}
        <button
            class="flex items-center gap-3 w-full"
            onclick={() => currencyStore.set(c.code)}
        >
            <span class="badge badge-sm badge-ghost w-8">{c.symbol}</span>
            <span>{getLabel(c)}</span>
        </button>
    {/snippet}
</AppSettingSelector>
