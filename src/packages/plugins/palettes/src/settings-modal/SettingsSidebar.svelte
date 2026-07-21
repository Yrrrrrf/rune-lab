<script lang="ts">
import { onMount } from "svelte";
import type { SidebarEntry } from "./sections.ts";

let {
  sidebar,
  activeSectionId,
  searchQuery = $bindable(),
  onSectionChange,
  onClose,
}: {
  sidebar: SidebarEntry[];
  activeSectionId: string;
  searchQuery: string;
  onSectionChange: (id: string) => void;
  onClose: () => void;
} = $props();

let inputEl = $state<HTMLInputElement>();

onMount(() => {
  inputEl?.focus();
});
</script>

<div
  class="w-64 bg-base-200/40 border-r border-base-200 flex flex-col p-4 gap-4 shrink-0">
  <div class="flex items-center justify-between">
    <span
      class="font-bold text-sm tracking-wider uppercase text-base-content/50">
      Settings
    </span>
    <button class="btn btn-sm btn-circle btn-ghost" onclick={onClose}>
      ✕
    </button>
  </div>

  <label
    class="input input-sm input-bordered flex items-center gap-2 w-full bg-base-100 shrink-0">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"
      fill="currentColor" class="w-4 h-4 opacity-50 shrink-0">
      <path fill-rule="evenodd"
        d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
        clip-rule="evenodd" />
    </svg>
    <input
      bind:this={inputEl}
      type="text"
      placeholder="Search settings..."
      class="grow"
      bind:value={searchQuery}
    />
    <kbd
      class="kbd kbd-xs bg-base-200/50 border-base-300 opacity-60 font-mono shrink-0">/</kbd>
  </label>

  <div class="flex-1 overflow-y-auto">
    <ul class="menu w-full p-0 gap-0.5">
      {#each sidebar as entry}
        <li>
          <button
            class="flex items-center gap-2.5 px-3 py-2 text-sm font-medium {activeSectionId === entry.id && !searchQuery ? 'menu-active bg-primary text-primary-content' : 'text-base-content/80'}"
            onclick={() => onSectionChange(entry.id)}
          >
            {#if entry.icon}
              <span class="text-base shrink-0">{entry.icon}</span>
            {/if}
            <span>{entry.label}</span>
          </button>
        </li>
      {/each}
    </ul>
  </div>
</div>
