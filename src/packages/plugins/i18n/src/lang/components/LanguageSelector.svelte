<script lang="ts">
import { ResourceSelector } from "rune-lab/ui";
import { getLanguageStore } from "../../plugin.ts";
import { languagePresenter } from "../presenter.ts";
import type { Language } from "../store.svelte.ts";

const languageStore = getLanguageStore();

let {
  languages: allowedLocales = languageStore.available.map((l: Language) =>
    String(l.code)
  ),
  onchange,
}: {
  languages?: string[];
  onchange?: (value: string) => void;
} = $props();

const available = $derived(
  languageStore.available.filter((l: Language) =>
    allowedLocales.includes(l.code)
  ),
);
</script>

<ResourceSelector
  store={languageStore}
  idKey="code"
  items={available}
>
  {#snippet triggerLabel(active: any)}
    <div class="flex items-center gap-2">
      <span class="text-lg">{active.flag}</span>
    </div>
  {/snippet}

  {#snippet item(l: any)}
    {@const p = languagePresenter.present(l)}
    <button
      class="flex items-center gap-3 w-full"
      onclick={() => {
        languageStore.set(l.code);
        onchange?.(l.code);
      }}
    >
      <span class="text-lg">{p.icon}</span>
      <span class="text-xs opacity-50 uppercase">{l.code}</span>
      <span class="flex-grow text-left">{p.label}</span>
    </button>
  {/snippet}
</ResourceSelector>
