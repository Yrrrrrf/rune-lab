<script lang="ts">
import type { SearchResult } from "./search.ts";

let {
  query,
  results = [],
  selectedIndex = 0,
  onResultClick,
}: {
  query: string;
  results: SearchResult[];
  selectedIndex: number;
  onResultClick: (res: SearchResult) => void;
} = $props();

function getGlyph(type: string): string {
  switch (type) {
    case "section":
      return "📁";
    case "field":
      return "🔧";
    case "shortcut":
      return "⌨️";
    case "command":
      return "⚡";
    default:
      return "•";
  }
}
</script>

<div class="flex flex-col h-full bg-base-100 overflow-hidden">
  <div class="flex-grow overflow-y-auto p-4">
    {#if results.length === 0}
      <div class="flex flex-col items-center justify-center h-full text-base-content/40 py-12">
        <span class="text-3xl mb-2">🔍</span>
        <span>No matching settings found for "{query}"</span>
      </div>
    {:else}
      <ul class="menu w-full p-0 gap-1">
        {#each results as result, index}
          <li>
            <button
              class="flex justify-between items-center py-3 px-4 rounded-lg {index === selectedIndex ? 'active bg-primary text-primary-content' : 'hover:bg-base-200'}"
              onclick={() => onResultClick(result)}
            >
              <div class="flex items-center gap-3 min-w-0">
                <span class="text-lg shrink-0">{getGlyph(result.type)}</span>
                <div class="flex flex-col text-left min-w-0">
                  <span class="font-medium text-sm truncate">{result.title}</span>
                  {#if result.description}
                    <span class="text-xs truncate {index === selectedIndex ? 'text-primary-content/70' : 'text-base-content/60'}">
                      {result.description}
                    </span>
                  {/if}
                </div>
              </div>
              <span class="badge badge-sm badge-outline shrink-0 {index === selectedIndex ? 'border-primary-content/40 text-primary-content' : 'border-base-300 text-base-content/60'}">
                {result.badge ?? result.type}
              </span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  <div
    class="border-t border-base-200 px-4 py-2 bg-base-200/30 flex items-center justify-between text-xs text-base-content/50 shrink-0">
    <div class="flex items-center gap-4">
      <span>Search Results for "{query}"</span>
    </div>
    <div class="flex items-center gap-2">
      <kbd class="kbd kbd-xs">↑↓</kbd> <span>Navigate</span>
      <kbd class="kbd kbd-xs">↵</kbd> <span>Select</span>
    </div>
  </div>
</div>
