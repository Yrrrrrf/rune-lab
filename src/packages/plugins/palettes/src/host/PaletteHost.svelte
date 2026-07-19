<script lang="ts">
import { onMount } from "svelte";
import { getRegistryStore, getShortcutStore } from "../accessors.ts";
import { bindShortcuts } from "./hotkeys.svelte.ts";

const registryStore = getRegistryStore();
const shortcutStore = getShortcutStore();

onMount(() => bindShortcuts(shortcutStore));

let dialogEl = $state<HTMLDialogElement>();

$effect(() => {
  if (dialogEl) {
    if (registryStore.activePaletteId) {
      dialogEl.showModal();
    } else {
      dialogEl.close();
    }
  }
});

$effect(() => {
  const activePalettes = registryStore.palettes;
  for (const palette of activePalettes) {
    if (palette.hotkey) {
      shortcutStore.register({
        id: `rl:palette:${palette.id}`,
        keys: palette.hotkey,
        label: `Open ${palette.title}`,
        category: "General",
        scope: "global",
        handler: (e) => {
          e.preventDefault();
          registryStore.open(palette.id);
        },
      });
    }
  }

  return () => {
    for (const palette of activePalettes) {
      if (palette.hotkey) {
        shortcutStore.unregister(`rl:palette:${palette.id}`);
      }
    }
  };
});

const activePalette = $derived(
  registryStore.palettes.find((p) => p.id === registryStore.activePaletteId),
);
</script>

<dialog
  bind:this={dialogEl}
  class="modal items-start pt-[10vh] backdrop-blur-sm"
  onclose={() => registryStore.close()}
>
  {#if activePalette}
    {@const Renderer = activePalette.renderer}
    <div
      class="modal-box p-0 overflow-hidden border border-base-300 shadow-2xl max-w-2xl w-full flex flex-col"
    >
      {#if Renderer}
        <Renderer />
      {/if}
    </div>
    <form method="dialog" class="modal-backdrop">
      <button onclick={() => registryStore.close()}>close</button>
    </form>
  {/if}
</dialog>
