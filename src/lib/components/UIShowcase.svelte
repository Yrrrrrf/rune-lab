<script lang="ts">
    import { onMount } from 'svelte';
    
    // Props with defaults
    export let initialCount: number = 0;

    // Reactive state
    let count = initialCount;
    let inputValue = "";
    let items: string[] = [];
    let mounted = false;
    
    // Computed value
    $: doubledCount = count * 2;
    
    // Lifecycle
    onMount(() => {
      mounted = true;
    });
    
    // Methods
    function handleIncrement() {
      count += 1;
    }
    
    function handleAddItem() {
      if (inputValue.trim()) {
        items = [...items, inputValue];
        inputValue = "";
      }
    }
  </script>
  
  <div class="showcase-container p-4 space-y-4 border rounded bg-white">
    <!-- Counter section -->
    <div class="space-y-2">
      <p>Count: {count} (Doubled: {doubledCount})</p>
      <button 
        on:click={handleIncrement}
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        Increment
      </button>
    </div>
    
    <!-- Input section -->
    <div class="space-y-2">
      <div class="flex gap-2">
        <input
          type="text"
          bind:value={inputValue}
          placeholder="Add an item"
          class="px-3 py-2 border rounded flex-1"
        />
        <button 
          on:click={handleAddItem}
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Add
        </button>
      </div>
      
      <!-- List with conditional rendering -->
      {#if items.length > 0}
        <ul class="space-y-1">
          {#each items as item}
            <li class="px-3 py-2 bg-gray-50 rounded">{item}</li>
          {/each}
        </ul>
      {:else}
        <p class="text-gray-500 italic">No items added yet</p>
      {/if}
    </div>
    
    <!-- Lifecycle demo -->
    <p class="text-sm text-gray-600">
      Component status: {mounted ? 'Mounted' : 'Mounting...'}
    </p>
  </div>
  
  <style>
    .showcase-container {
      max-width: 32rem;
      margin: 0 auto;
    }
  </style>
