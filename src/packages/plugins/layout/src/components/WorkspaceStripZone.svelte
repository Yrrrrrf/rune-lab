<script lang="ts">
import type { Snippet } from "svelte";
import { getLayoutStore } from "../plugin.ts";

let { workspaceStrip }: { workspaceStrip?: Snippet } = $props();
const layoutStore = getLayoutStore();
const zone = $derived(layoutStore.zones.strip);
</script>

{#if workspaceStrip && zone?.visible}
  <aside
    class="rl-strip h-full shrink-0 overflow-y-auto overflow-x-hidden bg-base-300 flex flex-col items-center py-3 gap-2 z-[60]"
    style="width: {zone.size ?? 72}px; --rl-strip-width: {zone.size ?? 72}px;"
  >
    {@render workspaceStrip()}
  </aside>
{/if}

<style>
.rl-strip::-webkit-scrollbar {
  width: 4px;
}
.rl-strip::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}
</style>
