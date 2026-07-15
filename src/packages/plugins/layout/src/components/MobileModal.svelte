<script lang="ts" generics="T">
import type { Snippet } from "svelte";

let {
  options,
  value,
  item,
  triggerLabel,
}: {
  options: T[];
  value: T;
  item: Snippet<[T]>;
  triggerLabel: Snippet<[T]>;
} = $props();

let modal = $state<HTMLDialogElement>();
</script>

<div class="md:hidden inline-block">
  <button
    type="button"
    class="btn btn-ghost btn-sm m-1 h-auto min-h-[2rem] px-2"
    aria-haspopup="dialog"
    onclick={() => modal?.showModal()}
  >
    <span class="flex items-center gap-2">
      {@render triggerLabel(value)}
    </span>
  </button>

  <dialog bind:this={modal} class="modal modal-bottom sm:modal-middle">
    <div class="modal-box p-0 overflow-hidden">
      <div
        class="p-4 bg-base-200 border-b border-base-300 flex justify-between items-center">
        <h3 class="font-bold text-lg">Select Option</h3>
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost">✕</button>
        </form>
      </div>
      <div class="max-h-[60vh] overflow-y-auto p-2">
        <ul class="menu bg-base-100 w-full p-0" role="menu">
          {#each options as option}
            <li class="border-b border-base-100 last:border-0" role="menuitem">
              <div
                role="button"
                tabindex="0"
                class="w-full text-left py-3 cursor-pointer hover:bg-base-200 px-4 transition-colors"
                onclick={() => modal?.close()}
                onkeydown={(e) => (e.key === "Enter" || e.key === " ") && modal?.close()}
              >
                {@render item(option)}
              </div>
            </li>
          {/each}
        </ul>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</div>
