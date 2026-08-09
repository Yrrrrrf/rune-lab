<script lang="ts">
import { getKernel } from "rune-lab/ui";

const kernel = getKernel();
const plugins = kernel.listPlugins();
const slots = kernel.listSlots();
</script>

<div class="h-full w-full bg-secondary/10 text-secondary p-4 flex flex-col gap-3 overflow-y-auto">
  <div>
    <h2 class="font-bold uppercase text-xs tracking-widest">Plugins</h2>
    <p class="text-[10px] opacity-70">This shell's own kernel — {plugins.length} registered</p>
  </div>

  <div class="flex flex-col gap-2">
    {#each plugins as plugin (plugin.id)}
      <div class="bg-base-100/60 rounded-lg p-2.5 text-base-content">
        <div class="font-mono text-xs font-semibold">{plugin.id}</div>
        <div class="text-[10px] opacity-60 mt-0.5 flex flex-wrap gap-x-3">
          <span>{plugin.slotNames.length} slot{plugin.slotNames.length === 1 ? "" : "s"}</span>
          {#if plugin.hasSettings}<span>settings</span>{/if}
          {#if plugin.requires.length > 0}
            <span>requires: {plugin.requires.join(", ")}</span>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <div class="divider my-1"></div>

  <div>
    <h2 class="font-bold uppercase text-xs tracking-widest">Slots</h2>
    <p class="text-[10px] opacity-70">{slots.length} total</p>
  </div>
  <div class="flex flex-col gap-1">
    {#each slots as slot (slot.id)}
      <div class="bg-base-100/60 rounded-lg p-2 text-base-content text-[10px] font-mono">
        <div class="font-semibold">{slot.slotName}</div>
        <div class="opacity-60">
          {slot.pluginId}
          {#if slot.persist}· persisted{/if}
          {#if !slot.expose}· internal{/if}
        </div>
      </div>
    {/each}
  </div>
</div>
