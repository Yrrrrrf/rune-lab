<script lang="ts">
    import { appData } from "$lib/stores/app.svelte.js";
    
    // Local state with runes
    let activeSection = $state('about');
    
    // Initialize app data
    $effect(() => {
        appData.init({
            name: 'Rune Lab',
            version: '0.1.0',
            description: 'A modern component library built with Svelte 5 Runes',
            author: 'Yrrrrrf'
        });
    });
    
    // Feature list
    const features = [
        { id: 'runes', title: 'Svelte 5 Runes', description: 'Built with Svelte 5\'s powerful reactivity primitives' },
        { id: 'themes', title: 'Theme System', description: 'Extensive theming capabilities with light/dark mode support' },
        { id: 'typescript', title: 'Type Safety', description: 'Full TypeScript support with strong typing' },
        { id: 'lightweight', title: 'Lightweight', description: 'Minimal dependencies for optimal performance' }
    ];
    
    // Tailwind color showcase
    const colors = [
        { name: 'Slate', bg: 'bg-slate-500', text: 'text-slate-500' },
        { name: 'Blue', bg: 'bg-blue-500', text: 'text-blue-500' },
        { name: 'Emerald', bg: 'bg-emerald-500', text: 'text-emerald-500' },
        { name: 'Amber', bg: 'bg-amber-500', text: 'text-amber-500' },
        { name: 'Rose', bg: 'bg-rose-500', text: 'text-rose-500' },
    ];

    let count = $state(0);
    let doubled = $derived(count * 2);
    
    // Effects for side effects
    $effect(() => {
        console.log(`Count changed: ${count}`);
    });
    
    function increment() {
        count++;
    }
</script>

<!-- Hero Section -->
<div class="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100">
    <!-- Navigation -->
    <nav class="bg-white dark:bg-gray-900 shadow-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <span class="text-2xl mr-2">⚗️</span>
                    <span class="font-bold text-xl">{appData.name}</span>
                </div>
                <div class="flex items-center space-x-4">
                    <button class="hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                            onclick={() => activeSection = 'about'}>
                        About
                    </button>
                    <button class="hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                            onclick={() => activeSection = 'features'}>
                        Features
                    </button>
                    <button class="hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                            onclick={() => activeSection = 'tailwind'}>
                        Tailwind
                    </button>
                    <a href="https://github.com/Yrrrrrf/rune-lab" target="_blank" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <!-- Simple SVG GitHub icon -->
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {#if activeSection === 'about'}
            <!-- About Section -->
            <div class="mb-12 text-center">
                <h1 class="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                    {appData.name}
                </h1>
                <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                    {appData.description}
                </p>
                <div class="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                    <button class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transform hover:scale-105 transition-transform">
                        Get Started
                    </button>
                    <button class="px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 font-medium rounded-lg shadow-sm">
                        Documentation
                    </button>
                </div>
            </div>
            
            <!-- Code Example -->
            <div class="bg-gray-800 rounded-lg shadow-xl p-6 max-w-3xl mx-auto overflow-hidden">
            <div class="text-gray-400 text-sm mb-2">Example using Svelte 5 Runes</div>
            <pre class="text-green-400 overflow-x-auto"><code>

            </div>
        {:else if activeSection === 'features'}
            <!-- Features Section -->
            <div class="text-center mb-12">
                <h2 class="text-3xl font-bold mb-4">Features</h2>
                <p class="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                    Rune Lab provides a comprehensive set of tools for building modern web applications.
                </p>
            </div>
            
            <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {#each features as feature}
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 transform hover:scale-105 transition-transform">
                        <div class="p-6">
                            <h3 class="text-xl font-semibold mb-2">{feature.title}</h3>
                            <p class="text-gray-600 dark:text-gray-300">{feature.description}</p>
                        </div>
                    </div>
                {/each}
            </div>
            
            <!-- Installation Instructions -->
            <div class="mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto">
                <div class="p-6">
                    <h3 class="text-xl font-semibold mb-2">Installation</h3>
                    <div class="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <code class="text-purple-600 dark:text-purple-400">npm install rune-lab</code>
                    </div>
                    <div class="mt-4 bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <code class="text-purple-600 dark:text-purple-400">deno add @yrrrrrf/rune-lab</code>
                    </div>
                </div>
            </div>
        {:else if activeSection === 'tailwind'}
            <!-- Tailwind Showcase Section -->
            <div class="text-center mb-12">
                <h2 class="text-3xl font-bold mb-4">Tailwind CSS Showcase</h2>
                <p class="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                    A small demonstration of Tailwind's utility-first approach.
                </p>
            </div>
            
            <!-- Color Showcase -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 p-6 max-w-4xl mx-auto mb-8">
                <h3 class="text-xl font-semibold mb-4">Color Palette</h3>
                <div class="flex flex-wrap gap-4">
                    {#each colors as color}
                        <div class="flex flex-col items-center">
                            <div class={`${color.bg} w-16 h-16 rounded-lg shadow-md`}></div>
                            <span class={`${color.text} mt-2 font-medium`}>{color.name}</span>
                        </div>
                    {/each}
                </div>
            </div>
            
            <!-- Typography -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 p-6 max-w-4xl mx-auto mb-8">
                <h3 class="text-xl font-semibold mb-4">Typography</h3>
                <div class="space-y-3">
                    <p class="text-4xl font-bold">Heading 1</p>
                    <p class="text-3xl font-bold">Heading 2</p>
                    <p class="text-2xl font-bold">Heading 3</p>
                    <p class="text-xl">Large text</p>
                    <p class="text-base">Regular text</p>
                    <p class="text-sm">Small text</p>
                    <p class="italic">Italic text</p>
                    <p class="font-mono">Monospace text</p>
                </div>
            </div>
            
            <!-- Layout Example -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 p-6 max-w-4xl mx-auto">
                <h3 class="text-xl font-semibold mb-4">Responsive Layout</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {#each Array(4) as _, i}
                        <div class="bg-gray-100 dark:bg-gray-700 h-24 rounded-lg flex items-center justify-center">
                            <span class="text-sm">Column {i + 1}</span>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </main>

    <!-- Footer -->
    <footer class="bg-white dark:bg-gray-900 py-8 mt-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center text-gray-500 dark:text-gray-400">
                <p>© {new Date().getFullYear()} {appData.author} - All rights reserved</p>
                <p class="text-sm mt-2">Version: {appData.version}</p>
            </div>
        </div>
    </footer>
</div>