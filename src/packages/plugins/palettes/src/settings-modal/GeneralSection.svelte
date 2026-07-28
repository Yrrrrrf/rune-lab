<script lang="ts">
import { SettingsFields } from "rune-lab/ui";
import AppMetadata from "./AppMetadata.svelte";
import type { FieldGroup } from "./sections.ts";

let { groups }: { groups: FieldGroup[] } = $props();
</script>

<div class="flex flex-col gap-6">
  <AppMetadata />

  {#each groups as group}
    {#if group.id === "general"}
      <div class="general-core">
        <SettingsFields
          fields={group.fields}
          section={{ id: group.id, label: group.label, pluginId: group.pluginId }}
        />
      </div>
    {:else}
      <div class="flex flex-col gap-4">
        <div class="divider my-0"></div>
        <div class="text-xs font-semibold uppercase tracking-widest text-base-content/50 px-1">
          {group.label}
        </div>
        <SettingsFields
          fields={group.fields}
          section={{ id: group.id, label: group.label, pluginId: group.pluginId }}
        />
      </div>
    {/if}
  {/each}
</div>
