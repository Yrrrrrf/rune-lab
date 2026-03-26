<!-- src/lib/layout/DetailPanel.svelte -->
<script lang="ts">
    import type { Snippet } from "svelte";

    let { children } = $props<{
        children: Snippet;
    }>();
</script>

<div class="p-6">
    {@render children()}
</div>
