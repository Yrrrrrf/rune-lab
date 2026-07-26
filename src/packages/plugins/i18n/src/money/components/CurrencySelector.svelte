<script lang="ts">
import { ResourceSelector } from "rune-lab/layout";
import { getCurrencyStore } from "../../plugin.ts";
import { getCurrencyName } from "../stores/currency.svelte.ts";

const currencyStore = getCurrencyStore();

let {
  codes = [],
  onchange,
}: {
  codes?: string[];
  onchange?: (value: string) => void;
} = $props();
</script>

<ResourceSelector
  store={currencyStore}
  idKey="code"
  filterKeys={codes}
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
        onchange?.(c.code);
      }}
    >
      <span class="badge badge-sm badge-ghost w-8">{c.symbol}</span>
      <span class="text-xs opacity-50 uppercase">{c.code}</span>
      <span class="flex-grow text-left">{getCurrencyName(c)}</span>
    </button>
  {/snippet}
</ResourceSelector>
