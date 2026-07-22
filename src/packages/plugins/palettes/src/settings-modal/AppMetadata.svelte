<script lang="ts">
import { getAppStore } from "rune-lab";

const appStore = getAppStore();
const initial = $derived(
  appStore.data.name ? appStore.data.name.charAt(0).toUpperCase() : "",
);
</script>

<div class="p-4 flex items-center gap-4 bg-base-200 rounded-box">
  {#if appStore.data.icon}
    <img
      src={appStore.data.icon}
      alt={appStore.data.name ?? ""}
      class="w-12 h-12 rounded-box object-cover shrink-0"
    />
  {:else if initial}
    <div class="flex items-center justify-center w-12 h-12 bg-primary/10 text-primary font-bold rounded-box text-xl shrink-0">
      {initial}
    </div>
  {/if}

  <div class="flex-1 min-w-0">
    <div class="flex items-center gap-2">
      {#if appStore.data.name}
        <span class="font-medium text-sm">{appStore.data.name}</span>
      {/if}
      {#if appStore.data.version}
        <span class="badge badge-primary badge-sm">v{appStore.data.version}</span>
      {/if}
    </div>
    {#if appStore.data.description}
      <p class="text-base-content/60 text-xs truncate mt-0.5">{appStore.data.description}</p>
    {/if}
  </div>

  <div class="text-right shrink-0 flex flex-col items-end gap-1">
    {#if appStore.data.author}
      <span class="text-base-content/70 text-xs font-medium">{appStore.data.author}</span>
    {/if}
    <div class="flex items-center gap-2 text-xs text-base-content/50">
      {#if appStore.data.repository}
        <a href={appStore.data.repository} target="_blank" rel="noopener noreferrer" class="link link-hover text-xs">Repo</a>
      {/if}
      {#if appStore.data.homepage}
        {#if appStore.data.repository}
          <span>•</span>
        {/if}
        <a href={appStore.data.homepage} target="_blank" rel="noopener noreferrer" class="link link-hover text-xs">Home</a>
      {/if}
      {#if appStore.data.license}
        {#if appStore.data.repository || appStore.data.homepage}
          <span>•</span>
        {/if}
        <span class="text-xs">{appStore.data.license}</span>
      {/if}
    </div>
  </div>
</div>
