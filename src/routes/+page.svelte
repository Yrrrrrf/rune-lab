<script lang="ts">
    import {
        ApiMonitor,
        appStore,
        apiStore,
        Toaster,
        commandStore,
        toastStore,
        themeStore,
        CommandPalette
    } from "$lib/index.ts";
    import AppSettingsManager from "$lib/showcase/AppSettingsManager.svelte";
    import * as m from "$lib/paraglide/messages.js";
    import { onMount } from "svelte";

    onMount(() => {
        appStore.init({
            name: "Rune Lab Explorer",
            description: "Testing Svelte 5 Runes abstractions",
            version: "1.0.0-beta",
        });

        apiStore.init("https://api.example.com", "v1");

        // Register testing commands
        commandStore.register({
            id: 'send-toast',
            title: 'Send Success Toast',
            category: 'System',
            icon: '✨',
            action: () => toastStore.success('Toast sent from Command Palette!')
        });

        commandStore.register({
            id: 'toggle-theme',
            title: 'Toggle Dark Mode',
            category: 'Appearance',
            icon: '🌓',
            action: () => themeStore.set(themeStore.current === 'dark' ? 'light' : 'dark')
        });

        commandStore.register({
            id: "log-app",
            title: "Console log app values",
            category: "Settings",
            icon: "📋",
            action: () => {
                console.log(appStore.info);
            },
        });
    });

    const openKey = "k";
</script>

<CommandPalette shortcutKey={openKey} />

<main
    class="min-h-screen bg-base-100 p-8 flex flex-col items-center justify-center gap-16 overflow-hidden"
>
    <!-- Branding Header -->
    <header
        class="text-center space-y-4 animate-in fade-in slide-in-from-top duration-700"
    >
        <h1
            class="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-primary to-secondary"
        >
            {appStore.name}
        </h1>
        <p class="text-xl opacity-60 font-medium max-w-md mx-auto">
            {appStore.description}
        </p>
        <div
            class="badge badge-lg badge-outline border-base-content/20 font-mono"
        >
            {appStore.info.version}
        </div>
        <div class="mt-4 text-xs opacity-50">
             <kbd class="kbd kbd-sm">CMD</kbd> + <kbd class="kbd kbd-sm">{openKey.toUpperCase()}</kbd> to explore commands
        </div>
    </header>

    <!-- Refactored Settings Showcase -->
    <AppSettingsManager />

    <!-- Message Card -->
    <div
        class="card bg-base-300 w-full max-w-md shadow-2xl border border-base-content/5"
    >
        <div class="card-body items-center text-center p-10">
            <div
                class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
            >
                <span class="text-3xl">🧪</span>
            </div>
            <h2 class="card-title text-3xl font-black">
                {m.hello_world({ name: "Yusepe" })}
            </h2>
            <p class="opacity-70">
                Svelte 5 Runes are powering this modular architecture.
            </p>
        </div>
    </div>

    <!-- The new API Monitor -->
    <ApiMonitor />

    <!-- Global Toaster -->
    <Toaster />
</main>

<style>
    :global(body) {
        font-family: "Inter", system-ui, sans-serif;
    }
</style>
