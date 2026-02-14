<script lang="ts">
    import {
        ApiMonitor,
        appConfig,
        Toaster,
        CommandPalette
    } from "$lib/index.ts";
    import AppSettingsManager from "$lib/showcase/AppSettingsManager.svelte";
    import * as m from "$lib/paraglide/messages.js";
    import { onMount } from "svelte";

    onMount(() => {
        appConfig.app.init({
            name: "Rune Lab Explorer",
            description: "Testing Svelte 5 Runes abstractions",
            version: "1.0.0-beta",
        });

        appConfig.api.init("https://api.example.com", "v1");

        // Register testing commands
        appConfig.commands.register({
            id: 'send-toast',
            title: 'Send Toast Notification',
            category: 'System',
            icon: '🔔',
            children: [
                {
                    id: 'toast-success',
                    title: 'Success Toast',
                    icon: '✨',
                    action: () => appConfig.toast.success('Operation completed successfully!')
                },
                {
                    id: 'toast-info',
                    title: 'Info Toast',
                    icon: 'ℹ️',
                    action: () => appConfig.toast.info('Here is some information.')
                },
                {
                    id: 'toast-warning',
                    title: 'Warning Toast',
                    icon: '⚠️',
                    action: () => appConfig.toast.warning('Please be careful.')
                },
                {
                    id: 'toast-error',
                    title: 'Error Toast',
                    icon: '🚫',
                    action: () => appConfig.toast.error('Something went wrong!')
                }
            ]
        });

        appConfig.commands.register({
            id: 'toggle-theme',
            title: 'Toggle Dark Mode',
            category: 'Appearance',
            icon: '🌓',
            action: () => appConfig.theme.set(appConfig.theme.current === 'dark' ? 'light' : 'dark')
        });

        appConfig.commands.register({
            id: "log-app",
            title: "Console log app values",
            category: "Settings",
            icon: "📋",
            action: () => {
                console.log(appConfig.app.info);
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
            {appConfig.app.name}
        </h1>
        <p class="text-xl opacity-60 font-medium max-w-md mx-auto">
            {appConfig.app.description}
        </p>
        <div
            class="badge badge-lg badge-outline border-base-content/20 font-mono"
        >
            {appConfig.app.info.version}
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
