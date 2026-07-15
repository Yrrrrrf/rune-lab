<script lang="ts">
import { ResourceSelector } from "@rune-lab/layout";
import { getThemeStore } from "./mod.ts";
import { getThemeName } from "./theme/store.svelte.ts";

const themeStore = getThemeStore();

let {
  themes = [],
  current = $bindable(String(themeStore.current)),
  onchange,
}: {
  themes?: string[];
  current?: string;
  onchange?: (value: string) => void;
} = $props();
</script>

<ResourceSelector
  store={themeStore}
  idKey="name"
  filterKeys={themes}
  {onchange}
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
        current = t.name;
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
        {getThemeName(t)}
      </span>
    </button>
  {/snippet}
</ResourceSelector>
