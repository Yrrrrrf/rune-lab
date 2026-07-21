<script lang="ts">
import { getSettingsSections } from "rune-lab";
import {
  getCommandStore,
  getRegistryStore,
  getShortcutStore,
} from "./accessors.ts";
import SettingsSearchResults from "./settings-modal/SettingsSearchResults.svelte";
import SettingsSectionContent from "./settings-modal/SettingsSectionContent.svelte";
import SettingsSidebar from "./settings-modal/SettingsSidebar.svelte";
import {
  computeSearchResults,
  type SearchResult,
} from "./settings-modal/search.ts";
import { deriveModalModel } from "./settings-modal/sections.ts";

const shortcutStore = getShortcutStore();
const commandStore = getCommandStore();
const registry = getRegistryStore();

const model = $derived(deriveModalModel(getSettingsSections()));
const activeSectionId = $derived(registry.activeSectionId);

let searchQuery = $state("");
let selectedIndex = $state(0);

$effect(() => {
  // Reset selectedIndex to 0 whenever searchQuery changes
  const _ = searchQuery;
  selectedIndex = 0;
});

const searchResults = $derived(
  computeSearchResults(
    searchQuery,
    model.sidebar,
    model.generalGroups,
    shortcutStore.entries,
    commandStore.commands,
  ),
);

function handleResultClick(r: SearchResult) {
  if (r.type === "section") {
    registry.setSection(r.sectionId);
  } else if (r.type === "field") {
    registry.setSection("general");
  } else if (r.type === "shortcut") {
    registry.setSection("shortcuts");
  } else if (r.type === "command") {
    r.action?.();
    registry.close();
  }
  searchQuery = "";
}

function handleKeyDown(e: KeyboardEvent) {
  if (!searchQuery) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (searchResults.length > 0) {
      selectedIndex = (selectedIndex + 1) % searchResults.length;
    }
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (searchResults.length > 0) {
      selectedIndex = (selectedIndex - 1 + searchResults.length) %
        searchResults.length;
    }
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (searchResults[selectedIndex]) {
      handleResultClick(searchResults[selectedIndex]);
    }
  }
}
</script>

<div
  class="flex flex-1 h-[80vh] overflow-hidden bg-base-100 rounded-2xl outline-none"
  onkeydown={handleKeyDown}
  role="presentation"
>
  <SettingsSidebar
    sidebar={model.sidebar}
    {activeSectionId}
    bind:searchQuery
    onSectionChange={(id) => {
      registry.setSection(id);
      searchQuery = "";
    }}
    onClose={() => registry.close()}
  />

  <div class="flex-1 flex flex-col overflow-hidden bg-base-100">
    {#if searchQuery}
      <SettingsSearchResults
        query={searchQuery}
        results={searchResults}
        {selectedIndex}
        onResultClick={handleResultClick}
      />
    {:else}
      <SettingsSectionContent sectionId={activeSectionId} {model} />
    {/if}
  </div>
</div>
