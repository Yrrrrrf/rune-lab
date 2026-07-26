<script lang="ts">
/**
 * The single shortcuts view (C24).
 *
 * Replaces the old `ShortcutPalette` / `ShortcutSettings` pair, which
 * reimplemented search, grouping and key rendering independently and visibly
 * disagreed about the result. The grouped-directory markup now lives in
 * `FilterableGroupedList`; the key/scope formatting lives in `./format.ts`;
 * what remains here is the one thing genuinely specific to this view — the
 * rebind affordance.
 */
import { FilterableGroupedList, getT } from "rune-lab";
import { onDestroy } from "svelte";
import { getShortcutsStore } from "../plugin.ts";
import type { ShortcutEntry } from "../types.ts";
import { formatCombos, matchesQuery, scopeLabel } from "./format.ts";
import { sortScopes } from "./grouping.ts";

let { autofocus = false }: { autofocus?: boolean } = $props();

const shortcutStore = getShortcutsStore();
const t = getT();

let recordingId = $state<string | null>(null);

function startRecording(id: string) {
  recordingId = id;
  globalThis.addEventListener("keydown", handleKeyDown, true);
}

function stopRecording() {
  if (recordingId) {
    globalThis.removeEventListener("keydown", handleKeyDown, true);
    recordingId = null;
  }
}

function handleKeyDown(e: KeyboardEvent) {
  e.preventDefault();
  e.stopPropagation();

  const key = e.key.toLowerCase();
  if (["control", "alt", "shift", "meta"].includes(key)) {
    // A bare modifier is not a combo yet — keep listening.
    return;
  }

  const parts: string[] = [];
  if (e.ctrlKey) parts.push("ctrl");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");
  if (e.metaKey) parts.push("meta");

  if (key === " ") parts.push("space");
  else if (key === "arrowup") parts.push("up");
  else if (key === "arrowdown") parts.push("down");
  else if (key === "arrowleft") parts.push("left");
  else if (key === "arrowright") parts.push("right");
  else parts.push(key);

  const combo = parts.join("+");
  if (combo && recordingId) {
    const original = shortcutStore.entries.find(
      (entry) => entry.id === recordingId,
    );
    if (original) {
      shortcutStore.unregister(original.id);
      shortcutStore.register({ ...original, keys: combo });
    }
  }
  stopRecording();
}

onDestroy(stopRecording);
</script>

<FilterableGroupedList
  items={shortcutStore.entries}
  itemKey={(entry: ShortcutEntry) => entry.id}
  group={(entry: ShortcutEntry) => entry.scope ?? "global"}
  subgroup={(entry: ShortcutEntry) => entry.category ?? "General"}
  matches={matchesQuery}
  sortGroups={sortScopes}
  groupLabel={scopeLabel}
  title={t("palettes.shortcuts.title", "Keyboard Shortcuts")}
  subtitle={t(
    "palettes.shortcuts.subtitle",
    "View and customize application commands",
  )}
  searchPlaceholder={t(
    "palettes.shortcuts.search_placeholder",
    "Search shortcuts...",
  )}
  {autofocus}
>
  {#snippet row(entry: ShortcutEntry)}
    <div class="flex items-center justify-between gap-4 group">
      <div class="flex flex-col min-w-0">
        <span
          class="text-sm opacity-80 group-hover:opacity-100 transition-opacity truncate"
        >
          {entry.label}
        </span>
        <span class="text-[10px] text-base-content/30 font-mono truncate">
          {entry.id}
        </span>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        {#if recordingId === entry.id}
          <span class="btn btn-xs btn-primary animate-pulse">
            {t("palettes.shortcuts.press_keys", "Press keys...")}
          </span>
          <button class="btn btn-xs btn-ghost" onclick={stopRecording}>
            {t("palettes.shortcuts.cancel", "Cancel")}
          </button>
        {:else}
          <div class="flex gap-1.5 items-center">
            {#each formatCombos(entry.keys) as combo, i (i)}
              <div class="flex gap-1 items-center">
                {#each combo as key, j (j)}
                  <kbd
                    class="kbd kbd-sm font-mono text-[10px] min-w-[20px] bg-base-300 border-base-content/10"
                  >
                    {key}
                  </kbd>
                {/each}
              </div>
            {/each}
          </div>

          <button
            class="btn btn-xs btn-ghost opacity-0 group-hover:opacity-100 transition-opacity"
            onclick={() => startRecording(entry.id)}
          >
            {t("palettes.shortcuts.edit", "Edit")}
          </button>
        {/if}
      </div>
    </div>
  {/snippet}
</FilterableGroupedList>
