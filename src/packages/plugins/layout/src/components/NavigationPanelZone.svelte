<script lang="ts">
import type { Snippet } from "svelte";
import { getLayoutStore } from "../plugin.ts";

let {
	navigationPanel,
	workspaceStrip,
}: { navigationPanel?: Snippet; workspaceStrip?: Snippet } = $props();
const layoutStore = getLayoutStore();
const zone = $derived(layoutStore.zones.nav);
const stripZone = $derived(layoutStore.zones.strip);
const visible = $derived(zone?.visible ?? false);
const size = $derived(zone?.size ?? 240);
const stripSize = $derived(
	stripZone?.visible && workspaceStrip ? (stripZone.size ?? 72) : 0,
);
</script>

{#if navigationPanel && visible}
  <button
    class="fixed inset-0 bg-black/50 md:hidden cursor-default border-none"
    style="z-index: var(--rl-z-backdrop, 40)"
    onclick={() => layoutStore.toggleZone("nav")}
    aria-label="Close navigation"
  >
  </button>
{/if}

{#if navigationPanel}
  <aside
    class="rl-nav h-full shrink-0 bg-base-200 overflow-hidden flex flex-col transition-all duration-300 ease-in-out max-md:fixed max-md:!w-[var(--rl-nav-width)]"
    class:border-r={visible}
    class:border-base-content={true}
    style="border-opacity: 0.05; z-index: var(--rl-z-nav, 50); width: {visible ? `${size}px` : "0px"}; --rl-nav-width: {size}px; left: {stripSize}px"
    class:max-md:-translate-x-[200%]={!visible}
    data-rl-panel="navigation"
  >
    <div class="w-full h-full flex flex-col">
      {@render navigationPanel()}
    </div>
  </aside>
{/if}

<style>
.rl-nav::-webkit-scrollbar {
  width: 4px;
}
.rl-nav::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}
</style>
