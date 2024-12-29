<script lang="ts">
  import ThemeSelector from "./layout/ThemeSelector.svelte";

  // State management with Svelte 5 runes
  let activeTab = $state(0);
  let counter = $state(0);
  let modalOpen = $state(false);
  let drawerOpen = $state(false);
  let loading = $state(false);
  let progress = $state(0);
  let rating = $state(3);
  let selected = $state("Option 1");
  let steps = $state(1);
  let toast = $state("");
  
  // Color variants for demonstration
  const colors = ['primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error'];
  const sizes = ['xs', 'sm', 'md', 'lg'];
  
  // Mock data for examples
  const stats = [
    { title: "Downloads", value: "31K", desc: "Jan 1st - Feb 1st" },
    { title: "New Users", value: "4,200", desc: "↗︎ 400 (22%)" },
    { title: "New Registers", value: "1,200", desc: "↘︎ 90 (14%)" }
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

  const tabs = [
    { title: 'Basic UI', icon: '🎨' },
    { title: 'Components', icon: '🧩' },
    { title: 'Layout', icon: '📐' },
    { title: 'Data Display', icon: '📊' },
    { title: 'Feedback', icon: '💫' }
  ];
</script>

<ThemeSelector />

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
        <span class="mr-2">{tab.icon}</span>
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

    {:else if activeTab === 1}
      <!-- Advanced Components -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Dropdown and Menu -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Dropdowns & Menus</h2>
            <div class="flex flex-wrap gap-4">
              <div class="dropdown">
                <button class="btn m-1">Dropdown</button>
                <ul class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                  <li><button class="w-full text-left">Item 1</button></li>
                  <li><button class="w-full text-left">Item 2</button></li>
                </ul>
              </div>

              <div class="menu bg-base-200 rounded-box">
                <li><button class="w-full text-left">Menu Item 1</button></li>
                <li><button class="w-full text-left">Menu Item 2</button></li>
              </div>
            </div>
          </div>
        </div>

        <!-- Steps -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Steps</h2>
            <ul class="steps steps-vertical lg:steps-horizontal w-full">
              <li class="step step-primary">Register</li>
              <li class="step" class:step-primary={steps >= 2}>Choose plan</li>
              <li class="step" class:step-primary={steps >= 3}>Purchase</li>
              <li class="step" class:step-primary={steps === 4}>Receive Product</li>
            </ul>
            <div class="flex justify-center mt-4">
              <button class="btn btn-primary" onclick={() => steps = steps < 4 ? steps + 1 : 1}>
                Next Step
              </button>
            </div>
          </div>
        </div>
      </div>

    {:else if activeTab === 2}
      <!-- Layout Elements -->
      <div class="grid grid-cols-1 gap-6">
        <!-- Hero Section -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Hero Section</h2>
            <div class="hero bg-base-200 rounded-box">
              <div class="hero-content text-center">
                <div class="max-w-md">
                  <h1 class="text-5xl font-bold">Hello there</h1>
                  <p class="py-6">This is a sample hero section with a button below.</p>
                  <button class="btn btn-primary">Get Started</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Grid Layout -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Grid Layout</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              {#each Array(3) as _, i}
                <div class="bg-primary text-primary-content p-4 rounded-box text-center">
                  Grid Item {i + 1}
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>

    {:else if activeTab === 3}
      <!-- Data Display -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Stats -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Statistics</h2>
            <div class="stats shadow">
              {#each stats as stat}
                <div class="stat">
                  <div class="stat-title">{stat.title}</div>
                  <div class="stat-value">{stat.value}</div>
                  <div class="stat-desc">{stat.desc}</div>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Table</h2>
            <div class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Job</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Cy Ganderton</td>
                    <td>Quality Control Specialist</td>
                    <td><button class="btn btn-xs">Details</button></td>
                  </tr>
                  <tr>
                    <td>Hart Hagerty</td>
                    <td>Desktop Support Technician</td>
                    <td><button class="btn btn-xs">Details</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    {:else if activeTab === 4}
      <!-- Feedback Elements -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Alerts -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Alerts</h2>
            <div class="flex flex-col gap-2">
              {#each colors as color}
                <div class="alert alert-{color}">
                  <span>This is a {color} alert</span>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- Progress & Loading -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Progress & Loading</h2>
            <progress class="progress w-full" value={progress} max="100"></progress>
            <div class="flex gap-2 mt-4">
              <button class="btn" onclick={simulateLoading}>
                {loading ? 'Loading...' : 'Simulate Loading'}
              </button>
              {#if loading}
                <span class="loading loading-spinner loading-lg"></span>
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/if}
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
    </div>
  {/if}

      <!-- Drawer -->
  {#if drawerOpen}
    <div class="drawer drawer-end">
      <input id="my-drawer" type="checkbox" class="drawer-toggle" checked />
      <div class="drawer-side">
        <button 
          class="drawer-overlay" 
          onclick={() => drawerOpen = false}
          onkeydown={(e) => e.key === 'Escape' && (drawerOpen = false)}
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