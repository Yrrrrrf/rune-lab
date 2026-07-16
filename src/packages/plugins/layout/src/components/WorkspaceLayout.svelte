<script module lang="ts">
import type { Snippet } from "svelte";
import type { LayoutConfig } from "../types.ts";

export interface WorkspaceLayoutProps {
  workspaceStrip?: Snippet;
  navigationPanel?: Snippet;
  content?: Snippet;
  detailPanel?: Snippet;
  statusbar?: Snippet;
  namespace?: string;
  config?: LayoutConfig;
  dir?: "ltr" | "rtl";
}
</script>
<script lang="ts">
import { getLayoutStore } from "../plugin.ts";
import { onMount } from "svelte";
import WorkspaceStripZone from "./WorkspaceStripZone.svelte";
import NavigationPanelZone from "./NavigationPanelZone.svelte";
import ContentAreaZone from "./ContentAreaZone.svelte";
import DetailPanelZone from "./DetailPanelZone.svelte";
import StatusbarZone from "./StatusbarZone.svelte";

const layoutStore = getLayoutStore();

let {
  workspaceStrip,
  navigationPanel,
  content,
  detailPanel,
  statusbar,
  namespace = "default",
  dir = "ltr",
}: WorkspaceLayoutProps = $props();

onMount(() => {
  layoutStore.init({ namespace });

  const originalHtmlOverflow = document.documentElement.style.overflow;
  const originalBodyOverflow = document.body.style.overflow;
  const originalHtmlHeight = document.documentElement.style.height;
  const originalBodyHeight = document.body.style.height;

  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  document.documentElement.style.height = "100%";
  document.body.style.height = "100%";

  const handleKeydown = (e: KeyboardEvent) => {
    const isMeta = e.ctrlKey || e.metaKey;
    if (isMeta && e.key === "b") {
      e.preventDefault();
      layoutStore.toggleZone("nav");
    } else if (isMeta && e.key === "j") {
      e.preventDefault();
      layoutStore.toggleZone("detail");
    }
  };

  window.addEventListener("keydown", handleKeydown);

  return () => {
    document.documentElement.style.overflow = originalHtmlOverflow;
    document.body.style.overflow = originalBodyOverflow;
    document.documentElement.style.height = originalHtmlHeight;
    document.body.style.height = originalBodyHeight;

    window.removeEventListener("keydown", handleKeydown);
  };
});
</script>

<div
  class="rl-layout flex flex-col h-[100dvh] w-screen overflow-hidden bg-base-100 text-base-content font-sans relative"
  data-rl-layout
  {dir}
>
  <div class="flex flex-1 w-full overflow-hidden relative">
    <WorkspaceStripZone {workspaceStrip} />
    <NavigationPanelZone {navigationPanel} {workspaceStrip} />
    <ContentAreaZone {content} />
    <DetailPanelZone {detailPanel} />
  </div>
  <StatusbarZone {statusbar} />
</div>

<style>
:global(.rl-layout) {
  --rl-strip-width: 72px;
  --rl-nav-width: 240px;
  --rl-detail-width: 320px;
}
</style>
