<script lang="ts" module>
export interface StatusbarItem {
  id: string;
  label: string;
  icon?: string;
  onClick?: () => void;
}
</script>
<script lang="ts">
import { getTextStore } from "../plugin.ts";
import { getKernel } from "@rune-lab/svelte";
import { onMount } from "svelte";
import StatusbarDropdown from "./StatusbarDropdown.svelte";

let { items: propsItems }: { items?: StatusbarItem[] } = $props();
const textStore = getTextStore();

const items = $derived.by(() => {
  if (propsItems) return propsItems;
  try {
    return getKernel().getContributions("statusbar") as StatusbarItem[];
  } catch {
    return [];
  }
});

let containerEl = $state<HTMLElement>(), containerWidth = $state(0);

let measuredItems = $derived.by(() => {
  const _ = textStore.epoch;
  if (!textStore.ready) return [];
  return items.map((item) => {
    let labelWidth = 0;
    try {
      const prepared = textStore.engine.prepareWithSegments(
        item.label,
        "12px sans-serif",
      );
      labelWidth = textStore.engine.measureNaturalWidth(prepared);
    } catch {
      labelWidth = item.label.length * 7;
    }
    return { item, width: labelWidth + (item.icon ? 32 : 16) };
  });
});

let layoutGroups = $derived.by(() => {
  const visible: StatusbarItem[] = [], collapsed: StatusbarItem[] = [];
  if (containerWidth <= 0) return { visible: items, collapsed: [] };
  let currentWidth = 0;
  for (let i = 0; i < measuredItems.length; i++) {
    const { item, width } = measuredItems[i];
    const limit = (i === measuredItems.length - 1)
      ? containerWidth
      : containerWidth - 50;
    if (currentWidth + width <= limit) {
      visible.push(item);
      currentWidth += width;
    } else {
      collapsed.push(item);
    }
  }
  return { visible, collapsed };
});

onMount(() => {
  if (!containerEl) return;
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) containerWidth = entry.contentRect.width;
  });
  observer.observe(containerEl);
  return () => observer.disconnect();
});
</script>

<div bind:this={containerEl}
  class="flex items-center justify-between w-full h-full text-xs text-base-content/75 font-mono select-none">
  <div class="flex items-center gap-2 overflow-hidden">
    {#each layoutGroups.visible as item (item.id)}
      <button onclick={item.onClick} class="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-base-content/10 transition-colors">
        {#if item.icon}<span class="text-sm">{item.icon}</span>{/if}
        <span>{item.label}</span>
      </button>
    {/each}
  </div>
  {#if layoutGroups.collapsed.length > 0}
    <StatusbarDropdown collapsed={layoutGroups.collapsed} />
  {/if}
</div>
