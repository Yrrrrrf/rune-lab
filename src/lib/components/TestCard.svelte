<script lang="ts">
  let activeTab = $state(0);
  
  const tabs = [
    { title: 'Basic UI', icon: '🎨' },
    { title: 'Components', icon: '🧩' },
    { title: 'Layout', icon: '📐' },
    { title: 'Data Display', icon: '📊' },
    { title: 'Feedback', icon: '💫' }
  ];
</script>

<!-- Test container with explicit Tailwind classes -->
<div class="w-full min-h-screen bg-base-200 p-4">
  <!-- Header Card -->
  <div class="w-full bg-white rounded-lg shadow-lg p-8 mb-8">
    <h1 class="text-4xl font-bold text-center mb-4">DaisyUI Showcase</h1>
    <p class="text-center text-gray-600 mb-6">A comprehensive demonstration of DaisyUI components with Svelte 5</p>
    
    <!-- Basic buttons to test styling -->
    <div class="flex justify-center gap-4">
      <button class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
        Test Button 1
      </button>
      <button class="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600">
        Test Button 2
      </button>
    </div>
  </div>

  <!-- Navigation -->
  <div class="flex justify-center mb-8 gap-2">
    {#each tabs as tab, i}
      <button 
        class="px-4 py-2 rounded-lg {activeTab === i ? 'bg-primary text-white' : 'bg-white'}"
        onclick={() => activeTab = i}
      >
        <span class="mr-2">{tab.icon}</span>
        {tab.title}
      </button>
    {/each}
  </div>

  <!-- Test Card Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Test Card 1 -->
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-2xl font-bold mb-4">Card Title 1</h2>
      <p class="text-gray-600">This is a test card with explicit Tailwind classes.</p>
    </div>

    <!-- Test Card 2 -->
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-2xl font-bold mb-4">Card Title 2</h2>
      <p class="text-gray-600">This is another test card with explicit Tailwind classes.</p>
    </div>
  </div>
</div>