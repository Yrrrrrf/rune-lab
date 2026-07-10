<script lang="ts">
  import ResourceSelector from "./ResourceSelector.svelte";
  import { getLanguageStore } from "@rune-lab/svelte";
  import { getLanguageName } from "./language.svelte.ts";

  const languageStore = getLanguageStore();

  let {
    languages: allowedLocales = languageStore.available.map((l) =>
      String(l.code)
    ),
    current = $bindable(String(languageStore.current)),
    onchange,
  }: {
    languages?: string[];
    current?: string;
    onchange?: (value: string) => void;
  } = $props();
</script>

<ResourceSelector
  store={languageStore}
  idKey="code"
  filterKeys={[...allowedLocales]}
  {onchange}
>
  {#snippet triggerLabel(active: any)}
    <div class="flex items-center gap-2">
      <span class="text-lg">{active.flag}</span>
    </div>
  {/snippet}

  {#snippet item(l: any)}
    <button
      class="flex items-center gap-3 w-full"
      onclick={() => {
        languageStore.set(l.code);
        current = l.code;
        onchange?.(l.code);
      }}
    >
      <span class="text-lg">{l.flag}</span>
      <span class="text-xs opacity-50 uppercase">{l.code}</span>
      <span class="flex-grow text-left">{getLanguageName(l)}</span>
    </button>
  {/snippet}
</ResourceSelector>
