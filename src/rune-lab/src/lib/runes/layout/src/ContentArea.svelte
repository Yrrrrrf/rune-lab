<!-- src/lib/layout/ContentArea.svelte -->
<script lang="ts">
    import type { Snippet } from "svelte";

    let { header, children } = $props<{
        header?: Snippet;
        children: Snippet;
    }>();
</script>

{#if header}
    <header class="h-12 flex-none flex items-center px-4 border-b border-base-content/5 bg-base-100/80 backdrop-blur-sm sticky top-0 z-10">
        {@render header()}
    </header>
{/if}

<div class="flex-1 overflow-y-auto">
    {@render children()}
</div>
