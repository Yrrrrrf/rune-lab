<script lang="ts">
import type { SettingsSection } from "@rune-lab/svelte";

let {
  activeSection,
}: {
  activeSection: SettingsSection;
} = $props();
</script>

<div class="flex-grow overflow-y-auto bg-base-100">
  {#if activeSection?.component}
    {@const ActiveComp = activeSection.component}
    <ActiveComp />
  {/if}
</div>
