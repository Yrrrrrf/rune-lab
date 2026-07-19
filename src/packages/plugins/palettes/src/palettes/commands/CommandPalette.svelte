<script lang="ts">
import { Icon } from "@rune-lab/layout";
import { onMount, tick } from "svelte";
import { getCommandStore, getRegistryStore } from "../../accessors.ts";
import type { Command } from "../../types.ts";

const commandStore = getCommandStore();
const registryStore = getRegistryStore();

let input = $state<HTMLInputElement>();
let query = $state("");
let selectedIndex = $state(0);
let navigationStack = $state<string[]>([]);

const currentParentId = $derived(navigationStack[navigationStack.length - 1]);
const filtered = $derived(commandStore.search(query, currentParentId));

$effect(() => {
  query;
  navigationStack.length;
  selectedIndex = 0;
});

$effect(() => {
  if (filtered.length > 0) {
    tick().then(() => {
      const activeEl = document.querySelector(".rl-command-list .active");
      activeEl?.scrollIntoView({ block: "nearest" });
    });
  }
});

onMount(() => {
  tick().then(() => input?.focus());
});

function handleAction(cmd: Command) {
  if (cmd.children && cmd.children.length > 0) {
    navigationStack.push(cmd.id);
    query = "";
    selectedIndex = 0;
  } else if (cmd.action) {
    cmd.action();
    registryStore.close();
  }
}

function goBack() {
  if (navigationStack.length > 0) {
    navigationStack.pop();
    query = "";
    selectedIndex = 0;
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (filtered.length === 0) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIndex = (selectedIndex + 1) % filtered.length;
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIndex = (selectedIndex - 1 + filtered.length) % filtered.length;
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (filtered[selectedIndex]) {
      handleAction(filtered[selectedIndex]);
    }
  } else if (
    e.key === "Backspace" &&
    query === "" &&
    navigationStack.length > 0
  ) {
    e.preventDefault();
    goBack();
  }
}
</script>

<div class="flex flex-col w-full" onkeydown={handleKeyDown} role="presentation">
  <!-- Breadcrumbs for Navigation -->
  {#if navigationStack.length > 0}
    <div class="breadcrumbs text-xs px-4 pt-4 opacity-50">
      <ul>
        <li><button onclick={goBack}>Root</button></li>
        {#each navigationStack as id}
          <li><span class="font-bold">{id}</span></li>
        {/each}
      </ul>
    </div>
  {/if}

  <!-- Search Input -->
  <div class="border-b border-base-200 p-4 flex items-center gap-3">
    <Icon name="search" class="opacity-50" />
    <input
      bind:this={input}
      type="text"
      class="bg-transparent outline-none w-full text-lg"
      placeholder={navigationStack.length > 0 ? "Search in subcommands..." : "What do you need?"}
      bind:value={query}
    />
    <div class="flex gap-1">
      <kbd class="kbd kbd-sm">↑↓</kbd>
      <kbd class="kbd kbd-sm">↵</kbd>
    </div>
  </div>

  <!-- Results -->
  <div class="max-h-[60vh] overflow-y-auto p-2 rl-command-list">
    {#if filtered.length === 0}
      <div class="p-8 text-center text-base-content/50">
        No results found for "{query}"
      </div>
    {:else}
      <ul class="menu w-full p-0 gap-1">
        {#each filtered as cmd, i}
          <li>
            <button
              onclick={() => handleAction(cmd)}
              class="
                flex justify-between items-center py-3 {i === selectedIndex
                ? 'active bg-primary text-primary-content'
                : ''}
              "
            >
              <div class="flex items-center gap-3">
                {#if cmd.icon}
                  <span class="text-xl">{cmd.icon}</span>
                {/if}
                <div class="flex flex-col items-start">
                  <span class="font-medium">{cmd.label}</span>
                  {#if cmd.category}
                    <span class="text-xs opacity-70">{cmd.category}</span>
                  {/if}
                </div>
              </div>
              <div class="flex items-center gap-2">
                {#if cmd.children && cmd.children.length > 0}
                  <span class="badge badge-sm badge-outline opacity-50">{
                    cmd.children.length
                  }</span>
                  <span class="text-xs opacity-40">→</span>
                {:else}
                  <span class="text-xs opacity-40">↵</span>
                {/if}
              </div>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  <div
    class="bg-base-200 p-2 text-[10px] uppercase tracking-widest text-center text-base-content/40 border-t border-base-200"
  >
    {
      navigationStack.length > 0
      ? "Backspace to go back"
      : "Search actions, pages, or settings"
    }
  </div>
</div>
