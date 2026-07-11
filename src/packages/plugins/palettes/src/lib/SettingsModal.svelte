<script lang="ts">
  import { onMount, tick } from "svelte";
  import { getSettingsSections, type SettingsSection } from "@rune-lab/svelte";
  import { getCommandStore, getShortcutStore } from "./mod.ts";
  import { getLayoutStore } from "rune-lab/layout";

  const sections = getSettingsSections();
  const shortcutStore = getShortcutStore();
  const commandStore = getCommandStore();
  const layoutStore = getLayoutStore();

  let dialog: HTMLDialogElement;
  let isOpen = $state(false);
  let activeSectionId = $state("general");
  let searchQuery = $state("");

  // Subsequence scoring fuzzy matcher
  function fuzzyScore(query: string, text: string): number {
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    if (!q) return 0;
    if (t.includes(q)) return 100 - t.indexOf(q);

    let score = 0;
    let qIdx = 0;
    for (let i = 0; i < t.length && qIdx < q.length; i++) {
      if (t[i] === q[qIdx]) {
        score += 10;
        qIdx++;
        if (i > 0 && t[i - 1] === q[qIdx - 2]) {
          score += 5;
        }
      }
    }
    return qIdx === q.length ? score : 0;
  }

  // Reactive search results
  interface SearchResult {
    type: "section" | "shortcut" | "command";
    title: string;
    description?: string;
    badge?: string;
    sectionId: string;
    action?: () => void;
    score: number;
  }

  const searchResults = $derived.by(() => {
    const q = searchQuery.trim();
    if (!q) return [];

    const list: SearchResult[] = [];

    // 1. Match sections
    for (const sec of sections) {
      const score = Math.max(
        fuzzyScore(q, sec.label),
        fuzzyScore(q, sec.id),
      );
      if (score > 0) {
        list.push({
          type: "section",
          title: sec.label,
          description: `Go to ${sec.label} settings section`,
          badge: "Section",
          sectionId: sec.id,
          score,
        });
      }
    }

    // 2. Match shortcuts
    for (const sh of shortcutStore.entries) {
      const score = Math.max(
        fuzzyScore(q, sh.label || ""),
        fuzzyScore(q, sh.keys || ""),
        fuzzyScore(q, sh.category || ""),
      );
      if (score > 0) {
        list.push({
          type: "shortcut",
          title: sh.label || "",
          description: `Shortcut: ${sh.keys || ""}`,
          badge: sh.category || "Shortcut",
          sectionId: "shortcuts",
          score,
        });
      }
    }

    // 3. Match commands
    for (const cmd of commandStore.commands) {
      const score = Math.max(
        fuzzyScore(q, cmd.label),
        fuzzyScore(q, cmd.category || ""),
      );
      if (score > 0) {
        list.push({
          type: "command",
          title: cmd.label,
          description: `Command Category: ${cmd.category || "General"}`,
          badge: "Command",
          sectionId: "commands", // fallback or map
          action: () => {
            // execute command if it has action
            if (cmd.action) cmd.action();
          },
          score,
        });
      }
    }

    return list.sort((a, b) => b.score - a.score);
  });

  const activeSection = $derived(
    sections.find((s) => s.id === activeSectionId) || sections[0],
  );

  function handleSectionChange(id: string) {
    activeSectionId = id;
    searchQuery = ""; // Clear search when switching tab
    const newHash = `#settings/${id}`;
    if (window.location.hash !== newHash) {
      history.replaceState(null, "", newHash);
    }
  }

  function handleDialogClose() {
    isOpen = false;
    searchQuery = "";
    // Strip hash from URL cleanly
    if (window.location.hash.startsWith("#settings")) {
      history.pushState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
  }

  function handleResultClick(result: SearchResult) {
    if (result.type === "command" && result.action) {
      result.action();
      dialog.close();
    } else {
      handleSectionChange(result.sectionId);
    }
  }

  function updateFromHash() {
    const hash = window.location.hash;
    if (hash.startsWith("#settings")) {
      const parts = hash.split("/");
      const section = parts[1] || "general";
      activeSectionId = section;
      if (!isOpen) {
        isOpen = true;
        dialog?.showModal();
      }
    } else {
      if (isOpen) {
        isOpen = false;
        dialog?.close();
      }
    }
  }

  onMount(() => {
    // Check initial hash
    updateFromHash();

    window.addEventListener("hashchange", updateFromHash);
    return () => {
      window.removeEventListener("hashchange", updateFromHash);
    };
  });

  // Track state changes to open/close native dialog
  $effect(() => {
    if (isOpen) {
      if (dialog && !dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog && dialog.open) {
        dialog.close();
      }
    }
  });

  // Register command to open settings
  $effect(() => {
    commandStore.register({
      id: "rl:settings:open",
      label: "Preferences: Open Settings",
      category: "Preferences",
      action: () => {
        const targetHash = `#settings/${activeSectionId}`;
        if (window.location.hash === targetHash) {
          isOpen = true;
          dialog?.showModal();
        } else {
          window.location.hash = targetHash;
        }
      },
    });

    return () => commandStore.unregister("rl:settings:open");
  });

  // Watch for layout navigation changes to open settings
  $effect(() => {
    if (layoutStore.activeNavItemId === "system.settings") {
      window.location.hash = `#settings/general`;
      layoutStore.navigate("");
    }
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
  bind:this={dialog}
  class="modal"
  onclose={handleDialogClose}
  onclick={(e) => {
    if (e.target === dialog) dialog.close();
  }}
>
  <div
    class="modal-box max-w-5xl h-[80vh] flex flex-col p-0 overflow-hidden bg-base-100 border border-base-200 shadow-2xl rounded-2xl"
  >
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <div
        class="w-64 bg-base-200/40 border-r border-base-200 flex flex-col p-4 gap-4"
      >
        <div class="flex items-center justify-between">
          <span
            class="font-bold text-sm tracking-wider uppercase text-base-content/50"
          >
            Settings
          </span>
          <button
            class="btn btn-sm btn-circle btn-ghost"
            onclick={() => dialog.close()}
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          placeholder="Search settings..."
          class="input input-sm input-bordered w-full bg-base-100"
          bind:value={searchQuery}
        />

        <div class="flex-1 overflow-y-auto space-y-1">
          {#each sections as sec}
            <button
              class="
                w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2.5 {activeSectionId === sec.id && !searchQuery
                ? 'bg-primary text-primary-content shadow-sm'
                : 'hover:bg-base-200 text-base-content/80 hover:text-base-content'}
              "
              onclick={() => handleSectionChange(sec.id)}
            >
              {#if sec.icon}
                <span class="text-base">{sec.icon}</span>
              {/if}
              {sec.label}
            </button>
          {/each}
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto bg-base-100">
        {#if searchQuery}
          <div class="p-6 space-y-4">
            <h3
              class="text-sm font-bold uppercase tracking-wider text-base-content/40"
            >
              Search Results for "{searchQuery}"
            </h3>

            {#if searchResults.length === 0}
              <div
                class="text-center py-12 text-base-content/40 border border-dashed border-base-200 rounded-2xl"
              >
                No matching settings found.
              </div>
            {:else}
              <div class="space-y-2">
                {#each searchResults as result}
                  <button
                    class="w-full text-left p-4 bg-base-200/20 hover:bg-base-200/60 border border-base-200/50 rounded-xl transition-all flex items-center justify-between gap-4"
                    onclick={() => handleResultClick(result)}
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
        {:else if activeSection}
          {@const ActiveComp = activeSection.component as any}
          <ActiveComp />
        {/if}
      </div>
    </div>
  </div>
</dialog>
