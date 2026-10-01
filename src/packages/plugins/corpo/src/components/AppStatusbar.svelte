<script lang="ts">
  import type { Snippet } from "svelte";
  import { APIMonitor, APIEnvironmentSelector } from "rune-lab/api";
  import { StatusbarOverflow } from "rune-lab/layout";
  import { getAppStore, getT } from "rune-lab/ui";
  import { getCorpoStore } from "../context.ts";
  let {
    children,
    class: className = "",
  }: { children?: Snippet; class?: string } = $props();
  const corpo = getCorpoStore();
  const app = getAppStore();
  const t = getT();
</script>

<div
  role="group"
  aria-label={t("corpo.status", "Application status")}
  class="flex w-full items-center gap-3 overflow-x-auto px-2 py-1 text-xs {className}"
>
  {#if corpo.showApi}<APIMonitor
      showDetails={corpo.showApiDetails}
      class="flex-nowrap! shrink-0"
    />{/if}
  {#if corpo.showApi && corpo.allowEnvironmentSwitch}<APIEnvironmentSelector
      class="w-auto shrink-0"
    />{/if}
  <div class="min-w-24 flex-1"><StatusbarOverflow /></div>
  {@render children?.()}
  {#if corpo.showVersion && app.data.version}<span class="shrink-0 opacity-70"
      >v{app.data.version}</span
    >{/if}
</div>
