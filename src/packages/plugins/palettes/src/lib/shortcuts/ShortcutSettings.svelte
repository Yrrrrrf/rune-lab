<script lang="ts">
  import { getShortcutStore } from "../mod.ts";

  const shortcutStore = getShortcutStore();

  let searchQuery = $state("");
  let recordingId = $state<string | null>(null);
  let recordedKeys = $state("");

  const filteredEntries = $derived.by(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return shortcutStore.entries;
    return shortcutStore.entries.filter(
      (e) =>
        e.label?.toLowerCase().includes(q) ||
        e.keys?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q) ||
        e.scope?.toLowerCase().includes(q),
    );
  });

  const groupedEntries = $derived.by(() => {
    const groups: Record<
      string,
      Record<string, typeof shortcutStore.entries>
    > = {};
    for (const entry of filteredEntries) {
      const scope = entry.scope ?? "global";
      const category = entry.category ?? "General";
      if (!groups[scope]) groups[scope] = {};
      if (!groups[scope][category]) groups[scope][category] = [];
      groups[scope][category].push(entry);
    }
    return groups;
  });

  function startRecording(id: string) {
    recordingId = id;
    recordedKeys = "";
    window.addEventListener("keydown", handleKeyDown, true);
  }

  function stopRecording() {
    if (recordingId) {
      window.removeEventListener("keydown", handleKeyDown, true);
      recordingId = null;
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    e.preventDefault();
    e.stopPropagation();

    const key = e.key.toLowerCase();
    if (["control", "alt", "shift", "meta"].includes(key)) {
      // Just modifiers, show feedback or update draft
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
        // Exercise register/unregister
        shortcutStore.unregister(original.id);
        shortcutStore.register({
          ...original,
          keys: combo,
        });
      }
    }
    stopRecording();
  }

  function resetShortcut(id: string, defaultKeys: string) {
    const original = shortcutStore.entries.find((entry) => entry.id === id);
    if (original) {
      shortcutStore.unregister(original.id);
      shortcutStore.register({
        ...original,
        keys: defaultKeys,
      });
    }
  }

  // Ensure listener is cleaned up if component is destroyed
  import { onDestroy } from "svelte";
  onDestroy(stopRecording);
</script>

<div class="p-6 space-y-6 max-w-4xl">
  <div
    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
  >
    <div>
      <h3 class="text-lg font-semibold mb-1">Keyboard Shortcuts</h3>
      <p class="text-sm text-base-content/60">
        View and customize keyboard shortcuts across layout, palettes, and
        plugins.
      </p>
    </div>
    <div>
      <input
        type="text"
        placeholder="Search shortcuts..."
        class="input input-bordered w-full sm:w-64"
        bind:value={searchQuery}
      />
    </div>
  </div>

  {#if Object.keys(groupedEntries).length === 0}
    <div
      class="text-center py-8 text-base-content/50 border border-dashed border-base-300 rounded-xl"
    >
      No shortcuts matching "{searchQuery}"
    </div>
  {:else}
    <div class="space-y-6">
      {#each Object.keys(groupedEntries) as scope}
        <div class="space-y-4">
          <h4
            class="text-xs font-bold uppercase tracking-wider text-base-content/50"
          >
            {scope} Scope
          </h4>

          {#each Object.keys(groupedEntries[scope]) as category}
            <div
              class="bg-base-200/30 border border-base-200 rounded-xl overflow-hidden shadow-sm"
            >
              <div
                class="bg-base-200/50 px-4 py-2 border-b border-base-200 text-sm font-medium"
              >
                {category}
              </div>

              <div class="divide-y divide-base-200">
                {#each groupedEntries[scope][category] as entry}
                  <div
                    class="px-4 py-3 flex items-center justify-between gap-4 hover:bg-base-200/20 transition-colors"
                  >
                    <div class="flex flex-col">
                      <span class="text-sm font-medium">{entry.label}</span>
                      <span
                        class="text-xs text-base-content/40 font-mono mt-0.5"
                      >{entry.id}</span>
                    </div>

                    <div class="flex items-center gap-3">
                      {#if recordingId === entry.id}
                        <span class="btn btn-sm btn-primary animate-pulse">
                          Press Key Combination...
                        </span>
                        <button
                          class="btn btn-sm btn-ghost"
                          onclick={stopRecording}
                        >
                          Cancel
                        </button>
                      {:else}
                        <div class="flex gap-1.5 items-center">
                          {#each entry.keys.split(",") as keyCombo}
                            <div class="flex gap-1 items-center">
                              {#each keyCombo.trim().split("+") as keyPart}
                                <kbd
                                  class="kbd kbd-sm bg-base-100 border-base-300 text-xs shadow-sm font-sans font-medium px-1.5 py-0.5 rounded"
                                >
                                  {keyPart}
                                </kbd>
                              {/each}
                            </div>
                          {/each}
                        </div>

                        <button
                          class="btn btn-sm btn-outline border-base-300 hover:border-base-400"
                          onclick={() => startRecording(entry.id)}
                        >
                          Edit
                        </button>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {/if}
</div>
