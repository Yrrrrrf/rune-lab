<script lang="ts">
// C22: nested `data-theme` scopes daisyUI's CSS variables, so this shows a
// theme's real colors regardless of which theme is currently active — pure
// CSS, server-renders, no JS. Four swatches, not nine: base-*/content colors
// are indistinct at this size.
//
// `data-theme={name}` is an attribute binding, safe for Tailwind's literal
// class scanner. Never interpolate a color into a class string instead
// (`class={`bg-${color}`}`) — that generates nothing.
let { name }: { name: string } = $props();
</script>

{#if name === "system"}
  <span class="text-lg" aria-hidden="true">🖥️</span>
{:else}
  <div data-theme={name} class="flex gap-1" aria-hidden="true">
    <span class="bg-primary size-3 rounded"></span>
    <span class="bg-secondary size-3 rounded"></span>
    <span class="bg-accent size-3 rounded"></span>
    <span class="bg-neutral size-3 rounded"></span>
  </div>
{/if}
