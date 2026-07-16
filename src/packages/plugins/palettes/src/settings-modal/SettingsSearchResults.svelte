<script lang="ts">
import type { SearchResult } from "./search.ts";

let {
  query,
  results = [],
  onResultClick,
}: {
  query: string;
  results: SearchResult[];
  onResultClick: (res: SearchResult) => void;
} = $props();
</script>

<div class="p-6 space-y-4">
  <h3 class="text-sm font-bold uppercase tracking-wider text-base-content/40">
    Search Results for "{query}"
  </h3>

  {#if results.length === 0}
    <div class="text-center py-12 text-base-content/40 border border-dashed border-base-200 rounded-2xl">
      No matching settings found.
    </div>
  {:else}
    <div class="space-y-2">
      {#each results as result}
        <button
          class="w-full text-left p-4 bg-base-200/20 hover:bg-base-200/60 border border-base-200/50 rounded-xl transition-all flex items-center justify-between gap-4"
          onclick={() => onResultClick(result)}
        >
          <div>
            <h4 class="font-medium text-sm text-base-content">
              {result.title}
            </h4>
            {#if result.description}
              <p class="text-xs text-base-content/50 mt-1">
                {result.description}
              </p>
            {/if}
          </div>
          <span class="badge badge-outline text-xs px-2.5 py-1">
            {result.badge}
          </span>
        </button>
      {/each}
    </div>
  {/if}
</div>
