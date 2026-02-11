<!-- src/client/sdk/ui/src/features/config/CurrencySelector.svelte -->
<script lang="ts">
    import AppSettingSelector from "./AppSettingSelector.svelte";
    import { currencyStore, type Currency } from "./mod";
    import { setLocale, locales } from "$lib/paraglide/runtime";
    import * as m from "$lib/paraglide/messages.js";
    import { createMessageResolver } from "$lib/devtools/message-resolver";

    const getLabel = createMessageResolver<Currency>(m as any, {
        keyExtractor: (c) => c.code,
    });

    let active = $derived(
        currencyStore.get(currencyStore.current) ?? currencyStore.available[0],
    );
</script>

<AppSettingSelector value={active} options={currencyStore.available}>
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
