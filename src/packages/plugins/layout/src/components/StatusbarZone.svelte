<script lang="ts">
import type { Snippet } from "svelte";
import { getLayoutStore } from "../plugin.ts";

let { statusbar }: { statusbar?: Snippet } = $props();
const layoutStore = getLayoutStore();
const zone = $derived(layoutStore.zones.statusbar);
const visible = $derived(zone?.visible ?? false);
const size = $derived(zone?.size ?? 24);
</script>

{#if statusbar && visible}
  <footer
    class="rl-statusbar w-full shrink-0 bg-base-300 border-t border-base-content/10 flex items-center px-4 overflow-hidden z-[70]"
    style="height: {size}px;"
  >
    {@render statusbar()}
  </footer>
{/if}
