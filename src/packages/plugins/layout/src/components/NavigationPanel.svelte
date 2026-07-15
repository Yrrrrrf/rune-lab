<script lang="ts">
import type { Snippet } from "svelte";
import type { NavigationItem, NavigationSection } from "../types.ts";
import NavigationItemRenderer from "./NavigationItemRenderer.svelte";

interface Props {
  header?: Snippet;
  sections: NavigationSection[];
  footer?: Snippet;
  activeId?: string | null;
  collapsedIds?: Set<string>;
  onSelect?: (item: NavigationItem) => void;
  onToggle?: (id: string, isOpen: boolean) => void;
}

let {
  header,
  sections = [],
  footer,
  activeId,
  collapsedIds = new Set(),
  onSelect,
  onToggle,
}: Props = $props();
</script>

<div class="flex flex-col h-full bg-base-200 text-base-content">
  {#if header}
    <div class="p-4 border-b border-base-content/10">
      {@render header()}
    </div>
  {/if}

  <div class="flex-1 overflow-y-auto">
    <ul class="menu menu-sm w-full p-2 gap-2">
      {#each sections as section (section.id)}
        <li>
          <details
            open={!collapsedIds.has(section.id)}
            ontoggle={(e) => {
              const open = (e.currentTarget as HTMLDetailsElement).open;
              onToggle?.(section.id, open);
            }}
          >
            <summary class="font-bold text-xs uppercase tracking-wider text-base-content/60 hover:text-base-content">
              {section.title}
            </summary>
            <ul>
              {#each section.items as item (item.id)}
                <NavigationItemRenderer {item} {activeId} {onSelect} />
              {/each}
            </ul>
          </details>
        </li>
      {/each}
    </ul>
  </div>

  {#if footer}
    <div class="p-2 border-t border-base-content/10 bg-base-300/50">
      {@render footer()}
    </div>
  {/if}
</div>
