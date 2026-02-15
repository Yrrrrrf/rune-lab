<script lang="ts">
  import type { Snippet } from 'svelte';
  let { title, icon = '', children } = $props<{ 
    title: string; 
    icon?: string; 
    children: Snippet 
  }>();
</script>

<div class="card bg-base-100 shadow-xl border border-base-content/5">
  <div class="card-body gap-0">
    <h2 class="card-title mb-4 flex items-center gap-2">
      {#if icon}<span class="text-2xl">{icon}</span>{/if}
      {title}
    </h2>
    {@render children()}
  </div>
</div>
