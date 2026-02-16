<script lang="ts">
  import { toastStore } from "$lib/state/toast.svelte";
  import { portal } from "$lib/actions/portal";
  import { flip } from "svelte/animate";
  import { fade, fly } from "svelte/transition";

  const typeClasses = {
    info: "alert-info",
    success: "alert-success",
    warning: "alert-warning",
    error: "alert-error",
  };
</script>

<svelte:element
  this={"div"}
  use:portal
  class="toast toast-end toast-bottom z-[9999] p-4 gap-3 pointer-events-none"
>
  {#each toastStore.toasts as toast (toast.id)}
    <div
      animate:flip={{ duration: 300 }}
      in:fly={{ y: 20, duration: 300 }}
      out:fade={{ duration: 200 }}
      class="alert {typeClasses[
        toast.type
      ]} shadow-lg min-w-[250px] border-none pointer-events-auto"
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
</svelte:element>
