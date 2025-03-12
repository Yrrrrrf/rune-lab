<script lang="ts">
    // import { ThemeSelector } from '$lib';

    // import { appStore, themeStore } from '../lib/stores/app.svelte.js';
    import { themeStore } from "$lib/index.js";
    import { appData } from "$lib/stores/app.svelte.js";

    // Local state with runes
    let count = $state(0);
    let activeTab = $state(0);
    let showModal = $state(false);
    
    // Initialize app data on load
    $effect(() => {
        appData.init({
            name: 'Rune Lab',
            version: '0.1.0',
            description: 'A modern component library built with Svelte 5 Runes',
            author: 'Yrrrrrf'
        });
        
        // Initialize theme
        themeStore.init();
    });
    
    // Tabs for our showcase
    const tabs = [
        { id: 'overview', name: 'Overview' },
        { id: 'components', name: 'Components' },
        { id: 'themes', name: 'Themes' },
    ];
    
    // Example colors for showcasing
    const colors = ['primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error'];
</script>

<div class="min-h-screen bg-base-200 flex flex-col">
    <!-- Header -->
    <header class="navbar bg-base-100 shadow-lg px-4 sm:px-8">
        <div class="flex-1">
            <a href="/" class="btn btn-ghost text-xl gap-2 normal-case">
                <span class="text-2xl">⚗️</span>
                <span>{appData.name}</span>
            </a>
        </div>
        
        <div class="flex-none gap-2">
            <!-- <div class="tooltip tooltip-left" data-tip="Change theme">
                <ThemeSelector />
            </div> -->
            
            <a 
                href="https://github.com/Yrrrrrf/rune-lab" 
                target="_blank"
                class="btn btn-ghost btn-circle"
                aria-label="GitHub"
            >
            </a>
        </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8 flex-grow">
        <!-- Hero Section -->
        <div class="hero bg-base-100 rounded-box mb-8">
            <div class="hero-content text-center">
                <div class="max-w-md">
                    <h1 class="text-5xl font-bold">Rune Lab</h1>
                    <p class="py-6">{appData.description}</p>
                    <div class="flex justify-center gap-2">
                        <button 
                            class="btn btn-primary"
                            onclick={() => showModal = true}
                        >
                            Get Started
                        </button>
                        <button 
                            class="btn btn-outline"
                            onclick={() => count++}
                        >
                            Count: {count}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Navigation Tabs -->
        <div class="tabs tabs-boxed justify-center mb-6">
            {#each tabs as tab, i}
                <button 
                    class="tab {activeTab === i ? 'tab-active' : ''}" 
                    onclick={() => activeTab = i}
                >
                    {tab.name}
                </button>
            {/each}
        </div>
        
        <!-- Tab Content -->
        <div class="tab-content">
            {#if activeTab === 0}
                <!-- Overview Tab -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="card bg-base-100 shadow-xl">
                        <div class="card-body">
                            <h2 class="card-title">Rune Lab Overview</h2>
                            <p>A modern component library built with Svelte 5 Runes, Tailwind CSS, and DaisyUI. Designed for building beautiful and interactive web applications.</p>
                            <div class="card-actions justify-end">
                                <button class="btn btn-primary">Learn More</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card bg-base-100 shadow-xl">
                        <div class="card-body">
                            <h2 class="card-title">Features</h2>
                            <ul class="list-disc pl-5 space-y-2">
                                <li>Built with Svelte 5 Runes</li>
                                <li>DaisyUI integration with all themes</li>
                                <li>TypeScript support</li>
                                <li>Modern reactivity model</li>
                                <li>Beautiful UI components</li>
                            </ul>
                        </div>
                    </div>
                </div>
            {:else if activeTab === 1}
                <!-- Components Tab -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Buttons -->
                    <div class="card bg-base-100 shadow-xl">
                        <div class="card-body">
                            <h2 class="card-title">Buttons</h2>
                            <div class="flex flex-wrap gap-2">
                                {#each colors as color}
                                    <button class="btn btn-{color}">{color}</button>
                                {/each}
                            </div>
                            <div class="divider">Variants</div>
                            <div class="flex flex-wrap gap-2">
                                <button class="btn btn-outline">Outline</button>
                                <button class="btn btn-link">Link</button>
                                <button class="btn">Default</button>
                                <button class="btn btn-ghost">Ghost</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Inputs -->
                    <div class="card bg-base-100 shadow-xl">
                        <div class="card-body">
                            <h2 class="card-title">Inputs</h2>
                            <input type="text" placeholder="Text input" class="input input-bordered w-full mb-2" />
                            <select class="select select-bordered w-full mb-2">
                                <option disabled selected>Select option</option>
                                <option>Option 1</option>
                                <option>Option 2</option>
                            </select>
                            <div class="form-control">
                                <label class="label cursor-pointer">
                                    <span class="label-text">Remember me</span>
                                    <input type="checkbox" class="checkbox checkbox-primary" />
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Alerts -->
                    <div class="card bg-base-100 shadow-xl">
                        <div class="card-body">
                            <h2 class="card-title">Alerts</h2>
                            <div class="alert alert-info mb-2">
                                <span>New information available.</span>
                            </div>
                            <div class="alert alert-success mb-2">
                                <span>Your purchase has been confirmed!</span>
                            </div>
                            <div class="alert alert-warning mb-2">
                                <span>Warning: Invalid email address!</span>
                            </div>
                            <div class="alert alert-error">
                                <span>Error! Task failed successfully.</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Cards -->
                    <div class="card bg-base-100 shadow-xl">
                        <figure><img src="https://placehold.co/400x200" alt="Sample" /></figure>
                        <div class="card-body">
                            <h2 class="card-title">Card Example</h2>
                            <p>Cards can contain various content types and are perfect for displaying information.</p>
                            <div class="card-actions justify-end">
                                <button class="btn btn-primary">Action</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Progress -->
                    <div class="card bg-base-100 shadow-xl">
                        <div class="card-body">
                            <h2 class="card-title">Progress</h2>
                            <progress class="progress progress-primary w-full mb-2" value="40" max="100"></progress>
                            <progress class="progress progress-secondary w-full mb-2" value="60" max="100"></progress>
                            <progress class="progress progress-accent w-full mb-2" value="80" max="100"></progress>
                            <div class="flex gap-2">
                                <span class="loading loading-spinner loading-xs"></span>
                                <span class="loading loading-spinner loading-sm"></span>
                                <span class="loading loading-spinner loading-md"></span>
                                <span class="loading loading-spinner loading-lg"></span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Badge -->
                    <div class="card bg-base-100 shadow-xl">
                        <div class="card-body">
                            <h2 class="card-title">Badges</h2>
                            <div class="flex flex-wrap gap-2">
                                {#each colors as color}
                                    <div class="badge badge-{color}">{color}</div>
                                {/each}
                            </div>
                            <div class="divider">Outline</div>
                            <div class="flex flex-wrap gap-2">
                                {#each colors as color}
                                    <div class="badge badge-outline badge-{color}">{color}</div>
                                {/each}
                            </div>
                        </div>
                    </div>
                </div>
            {:else if activeTab === 2}
                <!-- Themes Tab -->
                <div class="card bg-base-100 shadow-xl">
                    <div class="card-body">
                        <h2 class="card-title">Current Theme: {themeStore.currentTheme}</h2>
                        <p>Rune Lab supports all DaisyUI themes out of the box. Click on the theme selector in the header to change themes.</p>
                        
                        <div class="divider">Theme Preview</div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Color Palette -->
                            <div>
                                <h3 class="font-bold mb-2">Color Palette</h3>
                                <div class="grid grid-cols-2 gap-2">
                                    {#each colors as color}
                                        <div class="flex items-center gap-2">
                                            <div class="w-6 h-6 rounded-full bg-{color}"></div>
                                            <span>{color}</span>
                                        </div>
                                    {/each}
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 rounded-full bg-base-100"></div>
                                        <span>base-100</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 rounded-full bg-base-300"></div>
                                        <span>base-300</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Typography -->
                            <div>
                                <h3 class="font-bold mb-2">Typography</h3>
                                <h1 class="text-2xl font-bold">Heading 1</h1>
                                <h2 class="text-xl font-bold">Heading 2</h2>
                                <h3 class="text-lg font-bold">Heading 3</h3>
                                <p class="text-base">Paragraph text</p>
                                <p class="text-sm">Small text</p>
                                <p class="text-xs">Extra small text</p>
                            </div>
                        </div>
                        
                        <!-- <div class="card-actions justify-center mt-4">
                            <ThemeSelector />
                        </div> -->
                    </div>
                </div>
            {/if}
        </div>
    </main>
    
    <!-- Footer -->
    <footer class="footer footer-center p-4 bg-base-300 text-base-content">
        <div>
            <p>Copyright © {new Date().getFullYear()} - All rights reserved by {appData.author}</p>
            <p class="text-sm opacity-70">Version {appData.version}</p>
        </div>
    </footer>
    
    <!-- Modal -->
    {#if showModal}
        <div class="modal modal-open">
            <div class="modal-box">
                <h3 class="font-bold text-lg">Welcome to Rune Lab!</h3>
                <p class="py-4">
                    This is a modern component library built with Svelte 5 Runes. You're seeing this modal because you clicked "Get Started".
                </p>
                <div class="modal-action">
                    <button 
                        class="btn"
                        onclick={() => showModal = false}
                    >
                        Close
                    </button>
                </div>
            </div>
            <button 
                type="button"
                class="modal-backdrop"
                aria-label="Close modal"
                onclick={() => showModal = false}
                onkeydown={(e) => e.key === 'Enter' || e.key === ' ' ? showModal = false : null}
            ></button>
        </div>
    {/if}
</div>