<!-- src/layout/DetailPanel.svelte -->
<script lang="ts">
import type { Snippet } from "svelte";

export interface DetailPanelProps {
  children: Snippet;
}

let { children }: DetailPanelProps = $props();
</script>

<div class="p-6">
  {@render children()}
</div>
