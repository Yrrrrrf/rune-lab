<script lang="ts">
  import type { Snippet } from "svelte";
  import { getT, Icon } from "rune-lab/ui";
  import { ThemeSelector } from "rune-lab/layout";
  import { LanguageSelector } from "rune-lab/i18n";
  import { getRegistryStore } from "rune-lab/palettes";
  import { getCorpoStore } from "../context.ts";
  let {
    children,
    class: className = "",
  }: { children?: Snippet; class?: string } = $props();
  const corpo = getCorpoStore();
  const registry = getRegistryStore();
  const t = getT();
</script>

<div class="flex flex-wrap items-center justify-end gap-1 {className}">
  {#if corpo.actions.commands}
    <button
      type="button"
      class="btn btn-ghost btn-sm"
      aria-label={t("corpo.commands", "Commands")}
      onclick={() => registry.open("commands")}
    >
      <span aria-hidden="true"><Icon name="lucide:search" /></span>
    </button>
  {/if}
  {#if corpo.actions.settings}
    <button
      type="button"
      class="btn btn-ghost btn-sm"
      aria-label={t("corpo.settings", "Settings")}
      onclick={() => registry.open("settings")}
    >
      <span aria-hidden="true"><Icon name="lucide:settings" /></span>
    </button>
  {/if}
  {#if corpo.actions.theme}<ThemeSelector />{/if}
  {#if corpo.actions.language}<LanguageSelector />{/if}
  {@render children?.()}
</div>
