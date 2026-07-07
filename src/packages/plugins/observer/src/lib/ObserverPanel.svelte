<script lang="ts">
  import { onMount } from "svelte";

  let showPanel = $state(false);
  let activeTab = $state<"preview" | "persistence">("persistence");

  // Iframe state
  let urlInput = $state("/lab");
  let iframeUrl = $state("/lab");

  // Persistence inspector state
  let keys = $state<{ key: string; value: string | null }[]>([]);

  function loadKeys() {
    if (typeof window === "undefined") return;
    const list: typeof keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("rl:")) {
        list.push({
          key: k,
          value: localStorage.getItem(k),
        });
      }
    }
    keys = list.sort((a, b) => a.key.localeCompare(b.key));
  }

  function deleteKey(key: string) {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
    loadKeys();
    // Dispatch standard storage event to trigger Svelte store updates
    window.dispatchEvent(new Event("storage"));
  }

  function clearAll() {
    if (typeof window === "undefined") return;
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("rl:")) {
        toRemove.push(k);
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
    loadKeys();
    window.dispatchEvent(new Event("storage"));
  }

  function updateVisibility() {
    if (typeof window !== "undefined") {
      showPanel = window.localStorage.getItem("rl:observer:showPreview") !== "false";
    }
  }

  function handleGo() {
    iframeUrl = urlInput;
  }

  onMount(() => {
    updateVisibility();
    loadKeys();

    window.addEventListener("rl:observer:toggle", updateVisibility);
    window.addEventListener("storage", loadKeys);

    return () => {
      window.removeEventListener("rl:observer:toggle", updateVisibility);
      window.removeEventListener("storage", loadKeys);
    };
  });
</script>

{#if showPanel}
  <div class="fixed bottom-0 left-0 right-0 h-[32vh] bg-base-300 border-t-2 border-primary/20 z-[999] flex flex-col shadow-2xl font-sans">
    <!-- Header/Tab bar -->
    <div class="bg-base-200 px-4 py-2 flex items-center justify-between border-b border-base-200 shrink-0">
      <div class="flex items-center gap-4">
        <span class="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
          <span class="inline-block w-2 h-2 rounded-full bg-success animate-ping"></span>
          Rune Lab Observer
        </span>
        <div class="tabs tabs-boxed tabs-xs bg-base-300">
          <button
            class="tab text-xs {activeTab === 'persistence' ? 'tab-active bg-primary text-primary-content' : ''}"
            onclick={() => activeTab = "persistence"}
          >
            Persistence Inspector
          </button>
          <button
            class="tab text-xs {activeTab === 'preview' ? 'tab-active bg-primary text-primary-content' : ''}"
            onclick={() => activeTab = "preview"}
          >
            Iframe Preview
          </button>
        </div>
      </div>
      <div>
        <button
          class="btn btn-xs btn-ghost btn-circle"
          onclick={() => {
            showPanel = false;
            window.localStorage.setItem("rl:observer:showPreview", "false");
          }}
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Content area -->
    <div class="flex-1 overflow-hidden p-3 bg-base-100/90 backdrop-blur-sm">
      {#if activeTab === "persistence"}
        <div class="h-full flex flex-col gap-2.5 overflow-hidden">
          <div class="flex items-center justify-between shrink-0">
            <span class="text-xs text-base-content/60">
              Inspects key-value entries stored in localStorage under the <code>rl:</code> namespace.
            </span>
            <div class="flex items-center gap-2">
              <button class="btn btn-xs btn-outline btn-neutral" onclick={loadKeys}>
                Refresh
              </button>
              <button class="btn btn-xs btn-error btn-outline" onclick={clearAll}>
                Clear All
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto border border-base-200 rounded-lg bg-base-100">
            {#if keys.length === 0}
              <div class="text-center py-8 text-base-content/40 text-sm">
                No persisted keys found. Change settings (e.g. switch theme) to write values!
              </div>
            {:else}
              <table class="table table-xs w-full">
                <thead>
                  <tr class="bg-base-200/50">
                    <th>Key</th>
                    <th>Value</th>
                    <th class="w-16 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-base-200">
                  {#each keys as entry}
                    <tr class="hover:bg-base-200/20">
                      <td class="font-mono text-primary font-medium">{entry.key}</td>
                      <td class="font-mono max-w-xs truncate text-base-content/80">
                        {entry.value}
                      </td>
                      <td class="text-right">
                        <button
                          class="btn btn-xs btn-ghost text-error"
                          onclick={() => deleteKey(entry.key)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            {/if}
          </div>
        </div>
      {:else if activeTab === "preview"}
        <div class="h-full flex flex-col gap-2 overflow-hidden">
          <div class="flex gap-2 shrink-0">
            <input
              type="text"
              class="input input-xs input-bordered flex-1 font-mono"
              bind:value={urlInput}
              onkeydown={(e) => e.key === "Enter" && handleGo()}
            />
            <button class="btn btn-xs btn-primary px-4" onclick={handleGo}>
              Go
            </button>
          </div>
          <div class="flex-1 border border-base-200 rounded-lg overflow-hidden bg-base-100">
            <iframe
              src={iframeUrl}
              title="Rune Lab Preview"
              class="w-full h-full border-0"
            ></iframe>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
