<script lang="ts">
import type { Snippet } from "svelte";

let { content }: { content?: Snippet } = $props();
</script>

<main
  class="rl-content h-full flex-1 min-w-0 bg-base-100 flex flex-col overflow-hidden relative"
>
  {#if content}
    {@render content()}
  {:else}
    <div></div>
  {/if}
</main>
