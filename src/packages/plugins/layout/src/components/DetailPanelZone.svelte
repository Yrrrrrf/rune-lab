<script lang="ts">
import type { Snippet } from "svelte";
import { getLayoutStore } from "../plugin.ts";

let { detailPanel }: { detailPanel?: Snippet } = $props();
const layoutStore = getLayoutStore();
const zone = $derived(layoutStore.zones.detail);
const visible = $derived(zone?.visible ?? false);
const size = $derived(zone?.size ?? 320);
</script>

{#if detailPanel && visible}
  <button
    class="fixed inset-0 bg-black/50 md:hidden cursor-default border-none"
    style="z-index: var(--rl-z-backdrop, 40)"
    onclick={() => layoutStore.toggleZone("detail")}
    aria-label="Close detail panel"
  >
  </button>
{/if}

{#if detailPanel}
  <aside
    class="rl-detail h-full shrink-0 bg-base-100 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out max-md:fixed max-md:right-0 max-md:!w-[var(--rl-detail-width)]"
    class:border-l={visible}
    class:border-base-content={true}
    style="border-opacity: 0.05; z-index: var(--rl-z-detail, 50); width: {visible ? `${size}px` : "0px"}; --rl-detail-width: {size}px"
    class:max-md:translate-x-[200%]={!visible}
    data-rl-panel="detail"
  >
    <div class="w-full h-full flex flex-col">
      {@render detailPanel()}
    </div>
  </aside>
{/if}

<style>
.rl-detail::-webkit-scrollbar {
  width: 4px;
}
.rl-detail::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}
</style>
