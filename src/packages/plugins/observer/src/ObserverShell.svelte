<script lang="ts">
import { WorkspaceLayout } from "rune-lab/layout";
import type { Snippet } from "svelte";
import ContentFrame from "./ContentFrame.svelte";
import { getStateStore } from "./mod.ts";
import PluginListPanel from "./PluginListPanel.svelte";
import SectionSwitcher from "./SectionSwitcher.svelte";
import StorageBrowser from "./StorageBrowser.svelte";

let { children }: { children: Snippet } = $props();

const observer = getStateStore();

// Same-origin nesting guard: the content zone below embeds the current
// route by default, which boots this very app again. If we're already
// inside that embedded frame, fall straight through to the ordinary page
// instead of taking over the shell a second time.
const isNested = typeof window !== "undefined" && window.self !== window.top;
</script>

{#if isNested || !observer.enabled}
  {@render children()}
{:else}
  <WorkspaceLayout>
    {#snippet workspaceStrip()}
      <SectionSwitcher {observer} />
    {/snippet}
    {#snippet navigationPanel()}
      <PluginListPanel />
    {/snippet}
    {#snippet content()}
      <ContentFrame {observer} />
    {/snippet}
    {#snippet detailPanel()}
      {#if observer.activeSection === "storage"}
        <StorageBrowser />
      {/if}
    {/snippet}
  </WorkspaceLayout>
{/if}
