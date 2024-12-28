<script lang="ts">
//   import { ThemeSelector } from "./layout/ThemeSelector.svelte";

  // State for interactive demos
  let activeTab = $state(0);
  let counter = $state(0);
  let notifications = $state<string[]>([]);
  let loading = $state(false);
  let progress = $state(0);

  // Add a notification with auto-removal
  function addNotification() {
      const notification = `Notification ${notifications.length + 1}`;
      notifications = [...notifications, notification];
      setTimeout(() => {
      notifications = notifications.filter(n => n !== notification);
      }, 3000);
  }

  // Simulate loading
  function simulateLoading() {
      loading = true;
      setTimeout(() => loading = false, 2000);
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
      { title: 'Buttons', icon: '🔘' },
      { title: 'Cards', icon: '🎴' },
      { title: 'Alerts', icon: '⚠️' },
      { title: 'Forms', icon: '📝' }
  ];
</script>

<div class="min-h-screen bg-base-200 p-8">
<!-- Header -->
<div class="text-center mb-8">
  <h1 class="text-4xl font-bold text-base-content mb-2">UI Component Showcase</h1>
  <p class="text-base-content/70">Demonstrating Svelte 5 Runes with DaisyUI Components</p>
</div>

<!-- Theme Selector -->
<!-- Replace the old theme selector with: -->
<!-- <div class="flex justify-end mb-8">
  <ThemeSelector />
</div> -->

<!-- Tabs -->
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

<!-- Content -->
<div class="container mx-auto">
  {#if activeTab === 0}
  <!-- Buttons Section -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
          <h2 class="card-title mb-4">Basic Buttons</h2>
          <div class="flex flex-wrap gap-2">
          <button class="btn">Default</button>
          <button class="btn btn-primary">Primary</button>
          <button class="btn btn-secondary">Secondary</button>
          <button class="btn btn-accent">Accent</button>
          <button class="btn btn-ghost">Ghost</button>
          <button class="btn btn-link">Link</button>
          </div>
      </div>
      </div>

      <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
          <h2 class="card-title mb-4">Button Sizes</h2>
          <div class="flex flex-wrap items-center gap-2">
          <button class="btn btn-xs">Tiny</button>
          <button class="btn btn-sm">Small</button>
          <button class="btn">Normal</button>
          <button class="btn btn-lg">Large</button>
          </div>
      </div>
      </div>

      <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
          <h2 class="card-title mb-4">Interactive Counter</h2>
          <div class="flex items-center gap-4">
          <button class="btn btn-circle" onclick={() => counter--}>-</button>
          <span class="text-2xl">{counter}</span>
          <button class="btn btn-circle" onclick={() => counter++}>+</button>
          </div>
      </div>
      </div>
  </div>
  {:else if activeTab === 1}
  <!-- Cards Section -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="card bg-primary text-primary-content">
      <div class="card-body">
          <h2 class="card-title">Primary Card</h2>
          <p>This card has primary background color</p>
      </div>
      </div>

      <div class="card bg-secondary text-secondary-content">
      <div class="card-body">
          <h2 class="card-title">Secondary Card</h2>
          <p>This card has secondary background color</p>
      </div>
      </div>

      <div class="card bg-accent text-accent-content">
      <div class="card-body">
          <h2 class="card-title">Accent Card</h2>
          <p>This card has accent background color</p>
      </div>
      </div>
  </div>
  {:else if activeTab === 2}
  <!-- Alerts Section -->
  <div class="flex flex-col gap-4">
      <div class="alert alert-info">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <span>New messages: {notifications.length}</span>
      </div>

      <div class="flex gap-4">
      <button class="btn btn-info" onclick={addNotification}>
          Add Notification
      </button>
      <button class="btn btn-warning" onclick={simulateLoading}>
          {loading ? 'Loading...' : 'Simulate Loading'}
      </button>
      </div>

      {#if loading}
      <progress class="progress w-56"></progress>
      {/if}

      <progress class="progress progress-primary w-full" value={progress} max="100"></progress>

      <div class="flex flex-col gap-2">
      {#each notifications as notification}
          <div class="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{notification}</span>
          </div>
      {/each}
      </div>
  </div>
  {:else if activeTab === 3}
  <!-- Forms Section -->
  <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
      <h2 class="card-title mb-4">Form Elements</h2>
      <div class="form-control w-full max-w-xs gap-4">
          <span class="label-text">Text Input</span>
          <input type="text" placeholder="Type here" class="input input-bordered w-full max-w-xs" />
          
          <span class="label-text">Select</span>
          <select class="select select-bordered">
          <option disabled selected>Pick one</option>
          <option>Option 1</option>
          <option>Option 2</option>
          </select>

          <label class="label cursor-pointer">
          <span class="label-text">Toggle</span>
          <input type="checkbox" class="toggle toggle-primary" />
          </label>

          <label class="label cursor-pointer">
          <span class="label-text">Radio</span>
          <input type="radio" name="radio-10" class="radio radio-primary" />
          </label>

          <span class="label-text">Range</span>
          <input type="range" min="0" max="100" class="range range-primary" />
      </div>
      </div>
  </div>
  {/if}
</div>

<!-- Footer -->
<footer class="footer footer-center p-4 bg-base-300 text-base-content mt-8">
  <div>
  <p>Made with 💖 using Svelte 5 and DaisyUI</p>
  </div>
</footer>
</div>
