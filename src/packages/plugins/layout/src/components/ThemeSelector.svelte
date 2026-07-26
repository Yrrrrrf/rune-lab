<script lang="ts">
import { ResourceSelector } from "rune-lab";
import { getThemeStore } from "../plugin.ts";
import ThemeSwatch from "./ThemeSwatch.svelte";

const themeStore = getThemeStore();

// C21: which themes exist is single-sourced from the plugin config
// (`LayoutPlugin.with({ theme: { available: [...] } })`) via `store.available`
// — there is no client-side narrowing prop anymore.
let {
  onchange,
}: {
  onchange?: (value: string) => void;
} = $props();
</script>

<ResourceSelector
  store={themeStore}
  idKey="name"
>
  {#snippet triggerLabel(active: any)}
    <div class="flex items-center gap-2">
      <ThemeSwatch name={active.name} />
    </div>
  {/snippet}

  {#snippet item(t: any)}
    <button
      class="flex items-center gap-3 w-full"
      onclick={() => {
        themeStore.set(t.name);
        onchange?.(t.name);
      }}
    >
      <ThemeSwatch name={t.name} />
      <span class="flex-grow text-left capitalize">
        {t.name}
      </span>
    </button>
  {/snippet}
</ResourceSelector>
