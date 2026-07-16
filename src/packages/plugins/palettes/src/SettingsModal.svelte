<script lang="ts">
import { getSettingsSections } from "@rune-lab/svelte";
import {
  getCommandStore,
  getRegistryStore,
  getShortcutStore,
} from "./context.ts";
import {
  computeSearchResults,
  type SearchResult,
} from "./settings-modal/search.ts";
import {
  syncHashToState,
  updateHashFromState,
} from "./settings-modal/hash-routing.ts";
import SettingsSidebar from "./settings-modal/SettingsSidebar.svelte";
import SettingsSearchResults from "./settings-modal/SettingsSearchResults.svelte";
import SettingsSectionContent from "./settings-modal/SettingsSectionContent.svelte";
import { onMount } from "svelte";

const sections = getSettingsSections();
const shortcutStore = getShortcutStore();
const commandStore = getCommandStore();
const registryStore = getRegistryStore();

let activeSectionId = $state("general");
let searchQuery = $state("");

onMount(() => {
  return syncHashToState(
    (sec) => {
      activeSectionId = sec;
    },
    () => {
      registryStore.close();
    },
  );
});

$effect(() => {
  const isOpen = registryStore.activePaletteId === "settings";
  updateHashFromState(isOpen, activeSectionId);
});

const searchResults = $derived(
  computeSearchResults(
    searchQuery,
    sections,
    shortcutStore.entries,
    commandStore.commands,
  ),
);

const activeSection = $derived(
  sections.find((s) => s.id === activeSectionId) || sections[0],
);

function handleResultClick(result: SearchResult) {
  if (result.type === "command" && result.action) {
    result.action();
    registryStore.close();
  } else {
    activeSectionId = result.sectionId;
    searchQuery = "";
  }
}
</script>

<div class="flex flex-1 h-[80vh] overflow-hidden bg-base-100 rounded-2xl">
  <SettingsSidebar
    {sections}
    {activeSectionId}
    bind:searchQuery
    onSectionChange={(id) => {
      activeSectionId = id;
      searchQuery = "";
    }}
    onClose={() => registryStore.close()}
  />

  <div class="flex-1 flex flex-col overflow-hidden bg-base-100">
    {#if searchQuery}
      <SettingsSearchResults
        query={searchQuery}
        results={searchResults}
        onResultClick={handleResultClick}
      />
    {:else}
      <SettingsSectionContent {activeSection} />
    {/if}
  </div>
</div>
