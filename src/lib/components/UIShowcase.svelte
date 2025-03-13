<script lang="ts">
    import ThemeSelector from "./layout/ThemeSelector.svelte";
    import { 
      PaintBucket, 
      Puzzle, 
      Ruler, 
      ChartBar, 
      Sparkle 
    } from "lucide-svelte";
  
    // State management with Svelte 5 runes
    let activeTab = $state(0);
    let modalOpen = $state(false);
    let drawerOpen = $state(false);
    let loading = $state(false);
    let progress = $state(0);
    let selected = $state("Option 1");
    let toast = $state("");
    
    // Color variants for demonstration
    const colors = ['primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error'];
    const sizes = ['xs', 'sm', 'md', 'lg'];

    // Define tabs with icon components (not JSX syntax)
    const tabs = [
      { title: 'Basic UI', icon: PaintBucket },
      { title: 'Components', icon: Puzzle },
      { title: 'Layout', icon: Ruler },
      { title: 'Data Display', icon: ChartBar },
      { title: 'Feedback', icon: Sparkle }
    ];
  
    // Simulate loading
    function simulateLoading() {
      loading = true;
      setTimeout(() => loading = false, 2000);
    }
  
    // Show toast message
    function showToast(message: string) {
      toast = message;
      setTimeout(() => toast = "", 3000);
    }
  
    // Progress bar simulation
    $effect(() => {
      const interval = setInterval(() => {
        if (progress < 100) {
          progress += 1;
        } else {
          progress = 0;
        }
      }, 100);
  
      return () => clearInterval(interval);
    });
  </script>
  
  <div class="min-h-screen bg-base-200 p-4">
    <!-- Header with Theme Demo -->
    <div class="text-center mb-8 hero bg-base-100 rounded-box p-8">
      <div class="hero-content text-center">
        <div>
          <h1 class="text-5xl font-bold mb-4">DaisyUI Showcase</h1>
          <p class="text-xl opacity-75 mb-6">A comprehensive demonstration of DaisyUI components with Svelte 5</p>
          <div class="flex justify-center gap-2">
            <button class="btn btn-primary" onclick={() => modalOpen = true}>Open Modal</button>
            <button class="btn btn-secondary" onclick={() => drawerOpen = true}>Open Drawer</button>
            <button class="btn" onclick={() => showToast("This is a toast message!")}>Show Toast</button>
            <ThemeSelector />
          </div>
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
      {#if activeTab === 0}
        <!-- Basic UI Elements -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Buttons Showcase -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">Buttons</h2>
              <div class="flex flex-wrap gap-2">
                {#each colors as color}
                  <button class="btn btn-{color}">{color}</button>
                {/each}
              </div>
              <div class="divider">Sizes</div>
              <div class="flex flex-wrap gap-2 items-center">
                {#each sizes as size}
                  <button class="btn btn-{size}">{size}</button>
                {/each}
              </div>
              <div class="divider">States</div>
              <div class="flex flex-wrap gap-2">
                <button class="btn btn-primary loading">Loading</button>
                <button class="btn btn-disabled">Disabled</button>
                <button class="btn btn-outline">Outline</button>
                <button class="btn btn-link">Link</button>
              </div>
            </div>
          </div>
  
          <!-- Form Elements -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">Form Elements</h2>
              <div class="form-control gap-4">
                <label class="input-group">
                  <span>Email</span>
                  <input type="text" placeholder="info@site.com" class="input input-bordered" />
                </label>
                
                <select class="select select-bordered w-full" bind:value={selected}>
                  <option>Option 1</option>
                  <option>Option 2</option>
                  <option>Option 3</option>
                </select>
  
                <div class="flex gap-4">
                  <label class="label cursor-pointer">
                    <span class="label-text mr-2">Toggle</span>
                    <input type="checkbox" class="toggle toggle-primary" />
                  </label>
  
                  <label class="label cursor-pointer">
                    <span class="label-text mr-2">Radio</span>
                    <input type="radio" name="radio-10" class="radio radio-primary" />
                  </label>
                </div>
  
                <input type="range" min="0" max="100" class="range range-primary" />
              </div>
            </div>
          </div>
        </div>
      {/if}
      <!-- Other tab content would go here -->
    </div>
  
    <!-- Modal -->
    {#if modalOpen}
      <div class="modal modal-open">
        <div class="modal-box">
          <h3 class="font-bold text-lg">Modal Title</h3>
          <p class="py-4">This is a sample modal dialog using DaisyUI.</p>
          <div class="modal-action">
            <button class="btn" onclick={() => modalOpen = false}>Close</button>
          </div>
        </div>
        <button 
          class="modal-backdrop" 
          onclick={() => modalOpen = false} 
          onkeydown={(e) => e.key === 'Escape' && (modalOpen = false)}
          aria-label="Close modal"
        ></button>
      </div>
    {/if}
  
    <!-- Drawer -->
    {#if drawerOpen}
      <div class="drawer drawer-end drawer-open">
        <input id="my-drawer" type="checkbox" class="drawer-toggle" checked />
        <div class="drawer-side">
          <button 
            class="drawer-overlay" 
            onclick={() => drawerOpen = false}
            onkeydown={(e) => e.key === 'Escape' && (drawerOpen = false)}
            aria-label="Close drawer"
          ></button>
          <ul class="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
            <li><button class="w-full text-left">Sidebar Item 1</button></li>
            <li><button class="w-full text-left">Sidebar Item 2</button></li>
          </ul>
        </div>
      </div>
    {/if}
  
    <!-- Toast -->
    {#if toast}
      <div class="toast toast-end">
        <div class="alert alert-info">
          <span>{toast}</span>
        </div>
      </div>
    {/if}
  
    <!-- Footer -->
    <footer class="footer footer-center p-4 bg-base-300 text-base-content mt-8">
      <div>
        <p>Made with 💝 using Svelte 5 and DaisyUI</p>
      </div>
    </footer>
  </div>