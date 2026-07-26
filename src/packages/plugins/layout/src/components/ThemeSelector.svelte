<script lang="ts">
import { getThemeStore } from "../plugin.ts";
import ResourceSelector from "./ResourceSelector.svelte";

const themeStore = getThemeStore();

let {
  themes = [],
  onchange,
}: {
  themes?: string[];
  onchange?: (value: string) => void;
} = $props();
</script>

<ResourceSelector
  store={themeStore}
  idKey="name"
  filterKeys={themes}
>
  {#snippet triggerLabel(active: any)}
    <div class="flex items-center gap-2">
      <span class="text-lg">{active.icon}</span>
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
      <input
        type="radio"
        name="theme-{t.name}"
        class="theme-controller radio radio-xs"
        value={t.name}
        bind:group={themeStore.current}
      />
      <span class="text-lg">{t.icon}</span>
      <span class="flex-grow text-left capitalize">
        {t.name}
      </span>
    </button>
  {/snippet}
</ResourceSelector>
