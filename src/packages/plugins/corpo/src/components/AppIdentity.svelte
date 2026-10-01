<script lang="ts">
  import { getAppStore } from "rune-lab/ui";
  import { getCorpoStore } from "../context.ts";
  import Logo from "./Logo.svelte";
  let {
    compact = false,
    class: className = "",
  }: { compact?: boolean; class?: string } = $props();
  const corpo = getCorpoStore();
  const app = getAppStore();
</script>

{#snippet identity()}
  <Logo decorative />
  <span class="min-w-0">
    <span class="block truncate font-semibold">{corpo.company.name}</span>
    {#if !compact && app.data.name && app.data.name !== corpo.company.name}
      <span class="block truncate text-xs opacity-70">{app.data.name}</span>
    {/if}
  </span>
{/snippet}
{#if corpo.company.homeHref}
  <a
    class="flex min-w-0 items-center gap-2 rounded focus-visible:outline-2 {className}"
    href={corpo.company.homeHref}
  >
    {@render identity()}
  </a>
{:else}
  <div class="flex min-w-0 items-center gap-2 {className}">
    {@render identity()}
  </div>
{/if}
