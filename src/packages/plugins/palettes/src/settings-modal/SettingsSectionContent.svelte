<script lang="ts">
import { SettingsFields } from "rune-lab";
import GeneralSection from "./GeneralSection.svelte";
import type { ModalModel } from "./sections.ts";

let {
  sectionId,
  model,
}: {
  sectionId: string;
  model: ModalModel;
} = $props();
</script>

<div class="flex-grow overflow-y-auto bg-base-100 p-6">
  {#if sectionId === "general"}
    <GeneralSection groups={model.generalGroups} />
  {:else}
    {@const s = model.standalone.get(sectionId)}
    {#if s}
      {#if s.component}
        {@const ActiveComp = s.component}
        <ActiveComp />
      {:else}
        <SettingsFields fields={s.fields ?? []} />
      {/if}
    {/if}
  {/if}
</div>
