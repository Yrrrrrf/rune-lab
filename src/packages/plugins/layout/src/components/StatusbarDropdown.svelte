<script lang="ts">
import type { StatusbarItem } from "./StatusbarOverflow.svelte";

let { collapsed }: { collapsed: StatusbarItem[] } = $props();
</script>

<div class="dropdown dropdown-end dropdown-top">
  <div tabindex="0" role="button" class="btn btn-xs btn-ghost gap-1 px-2">
    <span>•••</span>
    <span class="badge badge-xs badge-neutral">{collapsed.length}</span>
  </div>
  <ul tabindex="-1"
    class="dropdown-content menu p-2 shadow bg-base-200 rounded-box w-40 z-[80]">
    {#each collapsed as item (item.id)}
      <li>
        <button onclick={item.onClick} class="w-full text-left py-2 px-3 flex items-center gap-2">
          {#if item.icon}<span>{item.icon}</span>{/if}
          <span>{item.label}</span>
        </button>
      </li>
    {/each}
  </ul>
</div>
