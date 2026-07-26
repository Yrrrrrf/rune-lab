<script lang="ts" generics="T">
/**
 * A searchable, two-level-grouped directory (C24).
 *
 * The counterpart to `ResourceSelector`: that one is "pick one of N", this one
 * is "browse and find". They deliberately do not share a component — a
 * dropdown and a directory have almost no markup in common, and a single
 * component spanning both would need optional selection, optional grouping,
 * optional search and two layout modes, making every consumer pay for the
 * union. What they share is the presenter contract, not the markup.
 *
 * Grouping is computed here rather than taken pre-grouped so that the search
 * filter and the grouping cannot disagree — the defect this component was
 * extracted to remove.
 *
 * Honest scope: exactly one consumer today, the merged shortcuts view. It
 * earns its place by being simpler than the two 180-line components it
 * replaced, not by a broader payoff that has not arrived.
 */
import type { Snippet } from "svelte";
import { onMount, tick } from "svelte";

interface Props {
  items: readonly T[];
  /** Stable identity for keyed iteration. */
  itemKey: (item: T) => string;
  /** Outer grouping — rendered as a section. */
  group: (item: T) => string;
  /** Inner grouping — rendered as a column within a section. */
  subgroup: (item: T) => string;
  /** Search predicate. `query` is already lowercased and trimmed. */
  matches: (item: T, query: string) => boolean;
  /** How to render a single row. */
  row: Snippet<[T]>;
  /** Order the outer groups. Defaults to insertion order. */
  sortGroups?: (groups: string[]) => string[];
  /** Display name for an outer group. Defaults to the raw key. */
  groupLabel?: (group: string) => string;
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  /** Focus the search box on mount — appropriate when opened by hotkey. */
  autofocus?: boolean;
  footer?: Snippet;
}

let {
  items,
  itemKey,
  group,
  subgroup,
  matches,
  row,
  sortGroups,
  groupLabel,
  title,
  subtitle,
  searchPlaceholder = "Search...",
  autofocus = false,
  footer,
}: Props = $props();

let input = $state<HTMLInputElement>();
let query = $state("");

const filtered = $derived.by(() => {
  const q = query.toLowerCase().trim();
  if (!q) return items;
  return items.filter((item) => matches(item, q));
});

const grouped = $derived.by(() => {
  const result: Record<string, Record<string, T[]>> = {};
  for (const item of filtered) {
    const g = group(item);
    const sg = subgroup(item);
    (result[g] ??= {})[sg] ??= [];
    result[g][sg].push(item);
  }
  return result;
});

const groupKeys = $derived.by(() => {
  const keys = Object.keys(grouped);
  return sortGroups ? sortGroups([...keys]) : keys;
});

onMount(() => {
  if (autofocus) tick().then(() => input?.focus());
});
</script>

<div class="flex flex-col w-full">
  {#if title || subtitle || true}
    <div class="border-b border-base-200 p-6 flex items-center gap-4 bg-base-200/30">
      {#if title || subtitle}
        <div class="flex-1 min-w-0">
          {#if title}
            <h2 class="text-xl font-bold tracking-tight">{title}</h2>
          {/if}
          {#if subtitle}
            <p class="text-xs opacity-50 uppercase tracking-widest font-medium">
              {subtitle}
            </p>
          {/if}
        </div>
      {/if}
      <div class="relative w-64 shrink-0 {title || subtitle ? '' : 'ml-auto'}">
        <input
          bind:this={input}
          bind:value={query}
          type="text"
          placeholder={searchPlaceholder}
          class="input input-sm w-full"
        />
      </div>
    </div>
  {/if}

  <div class="max-h-[60vh] overflow-y-auto p-6 space-y-8">
    {#if groupKeys.length === 0}
      <div class="py-12 text-center opacity-40 italic">
        {#if query}
          No results matching "{query}"
        {:else}
          Nothing to show
        {/if}
      </div>
    {:else}
      {#each groupKeys as groupKey (groupKey)}
        <section class="space-y-4">
          <header class="flex items-center gap-2">
            <h3 class="text-xs font-black uppercase tracking-widest text-primary/70">
              {groupLabel ? groupLabel(groupKey) : groupKey}
            </h3>
            <div class="h-px flex-1 bg-primary/10"></div>
          </header>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {#each Object.entries(grouped[groupKey] ?? {}) as [subKey, entries] (subKey)}
              <div class="space-y-2">
                <h4 class="text-[10px] font-bold opacity-30 uppercase">
                  {subKey}
                </h4>
                <ul class="space-y-3">
                  {#each entries as item (itemKey(item))}
                    <li>{@render row(item)}</li>
                  {/each}
                </ul>
              </div>
            {/each}
          </div>
        </section>
      {/each}
    {/if}
  </div>

  {#if footer}
    <div
      class="bg-base-200/50 p-3 px-6 text-[10px] flex justify-between items-center opacity-50 border-t border-base-200"
    >
      {@render footer()}
    </div>
  {/if}
</div>
