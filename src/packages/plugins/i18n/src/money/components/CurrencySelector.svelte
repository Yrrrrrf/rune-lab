<script lang="ts">
import { ResourceSelector } from "rune-lab/ui";
import { getCurrencyStore } from "../../plugin.ts";
import { currencyPresenter } from "../presenter.ts";

const currencyStore = getCurrencyStore();

let {
  codes = [],
  onchange,
}: {
  codes?: string[];
  onchange?: (value: string) => void;
} = $props();

const available = $derived(
  codes.length > 0
    ? currencyStore.available.filter((c) => codes.includes(c.code))
    : currencyStore.available,
);
</script>

<ResourceSelector
  store={currencyStore}
  idKey="code"
  items={available}
>
  {#snippet triggerLabel(active: any)}
    <div class="flex items-center gap-2">
      <span class="font-bold">{active.symbol}</span>
    </div>
  {/snippet}

  {#snippet item(c: any)}
    {@const p = currencyPresenter.present(c)}
    <button
      class="flex items-center gap-3 w-full"
      onclick={() => {
        currencyStore.set(c.code);
        onchange?.(c.code);
      }}
    >
      <span class="badge badge-sm badge-ghost w-8">{p.icon}</span>
      <span class="text-xs opacity-50 uppercase">{c.code}</span>
      <span class="flex-grow text-left">{p.label}</span>
    </button>
  {/snippet}
</ResourceSelector>
