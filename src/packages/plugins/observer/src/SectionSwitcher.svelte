<script lang="ts">
import type { ObserverState } from "./stores/state.svelte.ts";

let { observer }: { observer: ObserverState } = $props();

const sections = [
	{ id: "content" as const, icon: "🔗", label: "Content" },
	{ id: "storage" as const, icon: "🗄️", label: "Storage" },
];
</script>

<div
  class="h-full w-full rounded-xl bg-primary/15 text-primary flex flex-col items-center gap-2 py-3"
>
  <span class="text-xl" title="Rune Lab Observer">🔬</span>
  <div class="flex flex-col gap-1 mt-2">
    {#each sections as section (section.id)}
      <button
        class="btn btn-square btn-sm {observer.activeSection === section.id ? 'btn-primary' : 'btn-ghost'}"
        title={section.label}
        onclick={() => (observer.activeSection = section.id)}
      >
        {section.icon}
      </button>
    {/each}
  </div>
</div>
