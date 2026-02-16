<script lang="ts">
  import { toastStore } from "$lib/state/toast.svelte";
  import { portal } from "$lib/actions/portal";
  import { flip } from "svelte/animate";
  import { fade, fly } from "svelte/transition";

  const typeDetails = {
    info: {
      colors:
        "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
      iconColor: "text-blue-500",
      iconPath:
        "M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z",
    },
    success: {
      colors:
        "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
      iconColor: "text-emerald-500",
      iconPath:
        "M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z",
    },
    warning: {
      colors:
        "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
      iconColor: "text-amber-500",
      iconPath:
        "M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z",
    },
    error: {
      colors: "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
      iconColor: "text-red-500",
      iconPath:
        "M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z",
    },
  };
</script>

<svelte:element
  this={"div"}
  use:portal
  class="toast toast-end toast-bottom z-[9999] p-4 gap-3 pointer-events-none"
>
  {#each toastStore.toasts as toast (toast.id)}
    {@const styles = typeDetails[toast.type]}
    <div
      animate:flip={{ duration: 300 }}
      in:fly={{ y: 20, duration: 300 }}
      out:fade={{ duration: 200 }}
      class="pointer-events-auto relative flex w-full max-w-sm items-start gap-4 overflow-hidden rounded-xl border p-4 shadow-lg backdrop-blur-xl transition-all sm:min-w-[320px] {styles.colors}"
      role="alert"
    >
      <!-- Icon -->
      <div class="shrink-0 {styles.iconColor} mt-0.5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="w-5 h-5"
        >
          <path fill-rule="evenodd" d={styles.iconPath} clip-rule="evenodd" />
        </svg>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium leading-relaxed break-words">
          {toast.message}
        </p>
      </div>

      <!-- Dismiss Button -->
      <button
        class="shrink-0 -mr-2 -mt-2 btn btn-ghost btn-xs btn-circle opacity-60 hover:opacity-100 transition-opacity"
        onclick={() => toastStore.dismiss(toast.id)}
        aria-label="Close notification"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          class="w-4 h-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>

      <!-- Progress Bar (Optional Visual Accent) -->
      <div
        class="absolute bottom-0 left-0 h-0.5 w-full bg-current opacity-10"
      ></div>
    </div>
  {/each}
</svelte:element>
