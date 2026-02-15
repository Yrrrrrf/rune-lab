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

    import { appConfig } from "$lib/config.ts";
    import * as m from "$lib/paraglide/messages.js";
    import { onMount } from "svelte";
    import { locales } from "$lib/paraglide/runtime";
    import StyleCollector from "$lib/showcase/StyleCollector.svelte";

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

        <div class="divider">
            <LanguageSelector languages={[...locales]} />
            <ThemeSelector />
            <CurrencySelector />
        </div>
        <AppStateInspector />
        <StyleCollector />
    </header>

    <!-- Message Card -->
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

    <!-- The new API Monitor -->
    <ApiMonitor />

    <!-- Global Toaster -->
    <Toaster />
</main>
