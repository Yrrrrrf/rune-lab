<script lang="ts">
import type { NavigationItem } from "../types.ts";
import NavigationItemRenderer from "./NavigationItemRenderer.svelte";

let {
  item,
  activeId,
  onSelect,
}: {
  item: NavigationItem;
  activeId?: string | null;
  onSelect?: (item: NavigationItem) => void;
} = $props();

function handleItemClick() {
  onSelect?.(item);
  item.onClick?.();
}
</script>

<li>
  {#if item.children && item.children.length > 0}
    <details open={false}>
      <summary>
        {#if item.icon}<span class="text-lg">{item.icon}</span>{/if}
        <span class="flex-1">{item.label}</span>
      </summary>
      <ul>
        {#each item.children as child (child.id)}
          <NavigationItemRenderer item={child} {activeId} {onSelect} />
        {/each}
      </ul>
    </details>
  {:else}
    <button
      class:active={item.isActive !== undefined ? item.isActive : activeId === item.id}
      onclick={handleItemClick}
    >
      {#if item.icon}
        <span class="text-lg">{item.icon}</span>
      {/if}
      <span class="flex-1">{item.label}</span>
      {#if item.badge}
        <span class="badge badge-sm badge-ghost">{item.badge}</span>
      {/if}
    </button>
  {/if}
</li>
