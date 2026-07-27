<script lang="ts">
import { ResourceSelector } from "rune-lab/ui";
import { getThemeStore } from "../plugin.ts";
import ThemeSwatch from "./ThemeSwatch.svelte";

const themeStore = getThemeStore();

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
