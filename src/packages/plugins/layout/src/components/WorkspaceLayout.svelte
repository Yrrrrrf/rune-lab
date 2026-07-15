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
}
</script>
<script lang="ts">
import { getLayoutStore } from "../plugin.ts";
import { getLanguageStore } from "@rune-lab/i18n";
import { getShortcutStore, shortcutListener } from "@rune-lab/palettes";
import { LAYOUT_SHORTCUTS } from "../types.ts";
import { onMount } from "svelte";
import WorkspaceStripZone from "./WorkspaceStripZone.svelte";
import NavigationPanelZone from "./NavigationPanelZone.svelte";
import ContentAreaZone from "./ContentAreaZone.svelte";
import DetailPanelZone from "./DetailPanelZone.svelte";
import StatusbarZone from "./StatusbarZone.svelte";

const layoutStore = getLayoutStore();
const languageStore = getLanguageStore();
const shortcutStore = getShortcutStore();

const RTL_LANGUAGES = new Set(["ar", "he", "fa", "ur"]);
const dir = $derived(
  RTL_LANGUAGES.has(String(languageStore.current)) ? "rtl" : "ltr",
);

let {
  workspaceStrip,
  navigationPanel,
  content,
  detailPanel,
  statusbar,
  namespace = "default",
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

  // Register default layout shortcuts
  const shortcuts = [
    {
      ...LAYOUT_SHORTCUTS.TOGGLE_NAV,
      handler: (e: KeyboardEvent) => {
        e.preventDefault();
        layoutStore.toggleZone("nav");
      },
    },
    {
      ...LAYOUT_SHORTCUTS.TOGGLE_DETAIL,
      handler: (e: KeyboardEvent) => {
        e.preventDefault();
        layoutStore.toggleZone("detail");
      },
    },
  ];

  for (const s of shortcuts) {
    shortcutStore.register(s);
  }

  return () => {
    document.documentElement.style.overflow = originalHtmlOverflow;
    document.body.style.overflow = originalBodyOverflow;
    document.documentElement.style.height = originalHtmlHeight;
    document.body.style.height = originalBodyHeight;

    shortcutStore.unregister(LAYOUT_SHORTCUTS.TOGGLE_NAV.id);
    shortcutStore.unregister(LAYOUT_SHORTCUTS.TOGGLE_DETAIL.id);
  };
});
</script>

<div
  class="rl-layout flex flex-col h-[100dvh] w-screen overflow-hidden bg-base-100 text-base-content font-sans relative"
  use:shortcutListener={shortcutStore}
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
