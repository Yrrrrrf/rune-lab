<script lang="ts">
import { getAppStore } from "rune-lab";

const appStore = getAppStore();
const initial = $derived(
  appStore.name ? appStore.name.charAt(0).toUpperCase() : "",
);
</script>

<div class="p-4 flex items-center gap-4 bg-base-200 rounded-box">
  {#if appStore.icon}
    <img
      src={appStore.icon}
      alt={appStore.name}
      class="w-12 h-12 rounded-box object-cover shrink-0"
    />
  {:else}
    <div class="flex items-center justify-center w-12 h-12 bg-primary/10 text-primary font-bold rounded-box text-xl shrink-0">
      {initial}
    </div>
  {/if}

  <div class="flex-1 min-w-0">
    <div class="flex items-center gap-2">
      <span class="font-medium text-sm">{appStore.name}</span>
      <span class="badge badge-primary badge-sm">v{appStore.version}</span>
    </div>
    <p class="text-base-content/60 text-xs truncate mt-0.5">{appStore.description}</p>
  </div>

  <div class="text-right shrink-0 flex flex-col items-end gap-1">
    <span class="text-base-content/70 text-xs font-medium">{appStore.author}</span>
    <div class="flex items-center gap-2 text-xs text-base-content/50">
      {#if appStore.repository}
        <a href={appStore.repository} target="_blank" rel="noopener noreferrer" class="link link-hover text-xs">Repo</a>
      {/if}
      {#if appStore.homepage}
        {#if appStore.repository}
          <span>•</span>
        {/if}
        <a href={appStore.homepage} target="_blank" rel="noopener noreferrer" class="link link-hover text-xs">Home</a>
      {/if}
      {#if appStore.license}
        {#if appStore.repository || appStore.homepage}
          <span>•</span>
        {/if}
        <span class="text-xs">{appStore.license}</span>
      {/if}
    </div>
  </div>
</div>
