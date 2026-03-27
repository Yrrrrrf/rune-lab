<script lang="ts">
    import { ResourceSelector } from "@rune-lab/layout";
    import { getCurrencyStore } from "@rune-lab/kernel";

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
</script>

<ResourceSelector
    store={currencyStore}
    idKey="code"
    filterKeys={codes}
    {onchange}
>
    {#snippet triggerLabel(active)}
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
            <span>{c.code}</span>
        </button>
    {/snippet}
</ResourceSelector>
