<script lang="ts">
  import { toastStore } from "$lib/state/toast.svelte";
  import { flip } from "svelte/animate";
  import { fade, fly } from "svelte/transition";

  const typeClasses = {
    info: "alert-info",
    success: "alert-success",
    warning: "alert-warning",
    error: "alert-error",
  };

  // portal.ts - a Svelte action for rune-lab
  function portal(node: HTMLElement, target: string | HTMLElement = "body") {
    const targetEl =
      typeof target === "string" ? document.querySelector(target) : target;

    targetEl?.appendChild(node);

    return {
      destroy() {
        node.parentNode?.removeChild(node);
      },
    };
  }
</script>

{@html ""}
<svelte:element
  this={"div"}
  use:portal
  class="toast toast-end toast-bottom z-[9999]"
>
  <div class="toast toast-end toast-bottom z-[100] p-4">
    {#each toastStore.toasts as toast (toast.id)}
      <div
        animate:flip={{ duration: 300 }}
        in:fly={{ y: 20, duration: 300 }}
        out:fade={{ duration: 200 }}
        class="alert {typeClasses[
          toast.type
        ]} shadow-lg min-w-[250px] border-none"
      >
        <div class="flex items-center gap-2 w-full">
          <span>{toast.message}</span>
          <button
            class="btn btn-ghost btn-xs btn-circle ml-auto"
            onclick={() => toastStore.dismiss(toast.id)}
          >
            ✕
          </button>
        </div>
      </div>
    {/each}
  </div>
</svelte:element>
<!-- 
<style>
  @import "daisyui/components/toast.css";
  @import "daisyui/components/alert.css";
  @import "daisyui/components/button.css";
</style> -->
