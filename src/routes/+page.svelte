<script lang="ts">
    import {
        ApiMonitor,
        Toaster,
        CommandPalette,
        LanguageSelector,
        ThemeSelector,
        CurrencySelector,
    } from "$lib/index.ts";
    import AppStateInspector from "$lib/showcase/AppStateInspector.svelte";

    import { appConfig } from "$lib/config";

    import { onMount } from "svelte";
    import { locales } from "$lib/paraglide/runtime";
    import Showcase from "$lib/showcase/Showcase.svelte";

    import * as m from "$lib/paraglide/messages.js";

    onMount(() => {
        appConfig.app.init({
            name: "Rune Lab Explorer",
            description: "Testing Svelte 5 Runes abstractions",
            version: "0.0.14",
        });

        appConfig.api.init("https://api.example.com", "v1");
    });

    const openKey = "k";
</script>

<CommandPalette shortcutKey={openKey} />

<main
    class="min-h-screen bg-base-100 p-8 flex flex-col items-center justify-center gap-16 overflow-hidden"
>
    <!-- Branding Header -->
    <header
        class="text-center space-y-4 animate-in fade-in slide-in-from-top duration-700 w-full"
    >
        <div
            class="flex flex-col md:flex-row items-center justify-between gap-4 bg-base-200/50 p-6 rounded-3xl border border-base-content/5"
        >
            <div class="flex items-center gap-4">
                <img src="/img/rune.png" alt="Rune Lab" class="w-16 h-16" />
                <div class="text-left">
                    <h1
                        class="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-primary to-secondary"
                    >
                        {appConfig.app.name}
                    </h1>
                    <div
                        class="badge badge-sm badge-outline border-base-content/20 font-mono"
                    >
                        {appConfig.app.info.version}
                    </div>
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-2">
                <LanguageSelector languages={[...locales]} />
                <ThemeSelector />
                <CurrencySelector />
            </div>
        </div>

        <AppStateInspector />
        <Showcase />
    </header>

    <!-- The new API Monitor -->
    <ApiMonitor />

    <!-- Global Toaster -->
    <Toaster />
</main>
