<script lang="ts">
  import { ResourceSelector } from "@rune-lab/layout";
  import { getCurrencyStore } from "@rune-lab/svelte";
  import { getCurrencyName } from "./currency.svelte.ts";

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
  {#snippet triggerLabel(active: any)}
    <div class="flex items-center gap-2">
      <span class="font-bold">{active.symbol}</span>
    </div>
  {/snippet}

  {#snippet item(c: any)}
    <button
      class="flex items-center gap-3 w-full"
      onclick={() => {
        currencyStore.set(c.code);
        current = c.code;
        onchange?.(c.code);
      }}
    >
      <span class="badge badge-sm badge-ghost w-8">{c.symbol}</span>
      <span class="text-xs opacity-50 uppercase">{c.code}</span>
      <span class="flex-grow text-left">{getCurrencyName(c)}</span>
    </button>
  {/snippet}
</ResourceSelector>
