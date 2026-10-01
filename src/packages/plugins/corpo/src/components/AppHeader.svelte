<script lang="ts">
  import type { Snippet } from "svelte";
  import { getT, Icon } from "rune-lab/ui";
  import { getLayoutStore } from "rune-lab/layout";
  import { getCorpoStore } from "../context.ts";
  import AppIdentity from "./AppIdentity.svelte";
  import AppActions from "./AppActions.svelte";
  let {
    actions,
    class: className = "",
  }: { actions?: Snippet; class?: string } = $props();
  const corpo = getCorpoStore();
  const layout = getLayoutStore();
  const t = getT();
</script>

<header
  class="navbar flex-wrap gap-2 border-b border-base-300 bg-base-100 px-4 {className}"
>
  <div class="flex min-w-0 flex-1 items-center gap-2">
    {#if corpo.variant !== "consumer" && corpo.regions.navigation}
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        aria-label={t("corpo.toggle_navigation", "Toggle navigation")}
        aria-expanded={layout.zones.nav.visible}
        onclick={() => layout.toggleZone("nav")}
      >
        <span aria-hidden="true"><Icon name="lucide:menu" /></span>
      </button>
    {/if}
    <AppIdentity />
  </div>
  <AppActions children={actions} />
</header>
