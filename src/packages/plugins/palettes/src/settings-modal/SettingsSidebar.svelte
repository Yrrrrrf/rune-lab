<script lang="ts">
import type { SettingsSection } from "@rune-lab/svelte";

let {
  sections,
  activeSectionId,
  searchQuery = $bindable(),
  onSectionChange,
  onClose,
}: {
  sections: SettingsSection[];
  activeSectionId: string;
  searchQuery: string;
  onSectionChange: (id: string) => void;
  onClose: () => void;
} = $props();
</script>

<div
  class="w-64 bg-base-200/40 border-r border-base-200 flex flex-col p-4 gap-4">
  <div class="flex items-center justify-between">
    <span
      class="font-bold text-sm tracking-wider uppercase text-base-content/50">
      Settings
    </span>
    <button class="btn btn-sm btn-circle btn-ghost" onclick={onClose}>
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
        class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2.5 {activeSectionId === sec.id && !searchQuery
          ? 'bg-primary text-primary-content shadow-sm'
          : 'hover:bg-base-200 text-base-content/80 hover:text-base-content'}"
        onclick={() => onSectionChange(sec.id)}
      >
        {#if sec.icon}
          <span class="text-base">{sec.icon}</span>
        {/if}
        {sec.label}
      </button>
    {/each}
  </div>
</div>
