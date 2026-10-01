<script lang="ts">
  import { untrack } from "svelte";
  import { getT } from "rune-lab/ui";
  import { getLayoutStore, WorkspaceLayout } from "rune-lab/layout";
  import { getCorpoStore } from "../context.ts";
  import type { CorpoLayoutProps } from "../types.ts";
  import AppHeader from "./AppHeader.svelte";
  import AppNavigation from "./AppNavigation.svelte";
  import AppStatusbar from "./AppStatusbar.svelte";
  import AppFooter from "./AppFooter.svelte";
  let {
    children,
    activeHref,
    dir = "ltr",
    class: className = "",
    header,
    actions,
    navigation,
    workspaceStrip,
    detail,
    statusbar,
    footer,
  }: CorpoLayoutProps = $props();
  const corpo = getCorpoStore();
  const layout = getLayoutStore();
  const t = getT();
  const contentId = $props.id();
  // Initialize before WorkspaceLayout renders (also during SSR).
  // Thereafter, layout owns user toggles. Only corpo region changes resynchronize them.
  function syncLayout() {
    layout.applyPreset(
      corpo.variant === "docs"
        ? "docs"
        : corpo.variant === "consumer"
          ? "page"
          : "workspace",
    );
    layout.zones.nav = {
      ...layout.zones.nav,
      visible: corpo.regions.navigation,
    };
    layout.zones.strip = {
      ...layout.zones.strip,
      visible: corpo.regions.workspaceStrip,
    };
    layout.zones.detail = {
      ...layout.zones.detail,
      visible: corpo.regions.detail,
    };
    layout.zones.statusbar = { visible: corpo.regions.statusbar, size: 48 };
  }
  untrack(syncLayout);
  const snapshot = () => ({
    variant: corpo.variant,
    navigation: corpo.regions.navigation,
    workspaceStrip: corpo.regions.workspaceStrip,
    detail: corpo.regions.detail,
    statusbar: corpo.regions.statusbar,
  });
  let previous = untrack(snapshot);
  $effect(() => {
    const current = snapshot();
    untrack(() => {
      if (current.variant !== previous.variant) syncLayout();
      else {
        if (current.navigation !== previous.navigation)
          layout.zones.nav.visible = current.navigation;
        if (current.workspaceStrip !== previous.workspaceStrip)
          layout.zones.strip.visible = current.workspaceStrip;
        if (current.detail !== previous.detail)
          layout.zones.detail.visible = current.detail;
        if (current.statusbar !== previous.statusbar)
          layout.zones.statusbar.visible = current.statusbar;
      }
      previous = current;
    });
  });
</script>

{#snippet shellHeader()}
  {#if corpo.regions.header}{#if header}{@render header()}{:else}<AppHeader
        {actions}
      />{/if}{/if}
{/snippet}
{#snippet shellNavigation()}
  {#if corpo.regions.navigation}{#if navigation}{@render navigation()}{:else}<AppNavigation
        {activeHref}
      />{/if}{/if}
{/snippet}
{#snippet shellFooter()}
  {#if corpo.regions.footer}{#if footer}{@render footer()}{:else}<AppFooter
      />{/if}{/if}
{/snippet}
{#snippet shellStatus()}
  {#if corpo.regions.statusbar}{#if statusbar}{@render statusbar()}{:else}<AppStatusbar
      />{/if}{/if}
{/snippet}

<div
  {dir}
  class="bg-base-100 text-base-content {className}"
  data-corpo-shell={corpo.variant}
>
  <a
    class="link sr-only z-[100] bg-base-100 p-3 focus:not-sr-only focus:fixed focus:top-0"
    href="#{contentId}">{t("corpo.skip_content", "Skip to content")}</a
  >
  {#if corpo.variant === "consumer"}
    <div class="flex min-h-dvh flex-col">
      {@render shellHeader()}
      {@render shellNavigation()}
      <main id={contentId} tabindex="-1" class="min-w-0 flex-1">
        {@render children()}
      </main>
      {@render shellFooter()}
      {@render shellStatus()}
    </div>
  {:else}
    <WorkspaceLayout
      {dir}
      navigationPanel={corpo.regions.navigation ? shellNavigation : undefined}
      workspaceStrip={corpo.regions.workspaceStrip ? workspaceStrip : undefined}
      detailPanel={corpo.regions.detail ? detail : undefined}
      statusbar={shellStatus}
    >
      {#snippet content()}
        {@render shellHeader()}
        <div id={contentId} tabindex="-1" class="min-h-0 flex-1 overflow-auto">
          {@render children()}
          {@render shellFooter()}
        </div>
      {/snippet}
    </WorkspaceLayout>
  {/if}
</div>
