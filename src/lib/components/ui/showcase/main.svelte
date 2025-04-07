<script lang="ts">
  import { Sparkle, FileInput, PaintBucket, Ruler, ChartBar, Puzzle } from '@lucide/svelte';
  import BasicUI from './BasicUI.svelte';
  import DataInput from './DataInput.svelte';
  
  // State management with Svelte 5 runes
  let activeTab = $state(0);
  
  // Define tabs with icon components
  const tabs = [
    { title: 'Basic UI', icon: PaintBucket, component: BasicUI },
    { title: 'Data Input', icon: FileInput, component: DataInput },
    { title: 'Components', icon: Puzzle, component: null },
    { title: 'Layout', icon: Ruler, component: null },
    { title: 'Data Display', icon: ChartBar, component: null },
    { title: 'Feedback', icon: Sparkle, component: null }
  ];
</script>

<div class="min-h-screen bg-base-200 p-4">
  <!-- Header -->
  <div class="text-center mb-8 hero bg-base-100 rounded-box p-8">
    <div class="hero-content text-center">
      <div>
        <h1 class="text-5xl font-bold mb-4">DaisyUI Showcase</h1>
        <p class="text-xl opacity-75 mb-6">A comprehensive demonstration of DaisyUI components with Svelte 5</p>
      </div>
    </div>
  </div>

  <!-- Navigation Tabs -->
  <div class="tabs tabs-boxed justify-center mb-8">
    {#each tabs as tab, i}
      <button
        class="tab {activeTab === i ? 'tab-active' : ''}"
        onclick={() => activeTab = i}
      >
        <tab.icon size={18} class="mr-2" />
        {tab.title}
      </button>
    {/each}
  </div>

  <!-- Main Content -->
  <div class="container mx-auto">
    {#if tabs[activeTab]?.component}
      <!-- svelte-ignore svelte_component_deprecated -->
      <svelte:component this={tabs[activeTab].component} />
    {:else}
      <div class="card bg-base-100 shadow-xl p-8 text-center">
        <h2 class="text-2xl font-bold">Coming Soon</h2>
        <p class="mt-4">This section is under development.</p>
      </div>
    {/if}
  </div>
  
  <!-- Footer -->
  <footer class="footer footer-center p-4 bg-base-300 text-base-content mt-8">
    <div>
      <p>Made with 💝 using Svelte 5 and DaisyUI</p>
    </div>
  </footer>
</div>