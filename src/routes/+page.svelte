<script lang="ts">
    import {
        ApiMonitor,
        Toaster,
        LanguageSelector,
        ThemeSelector,
        CurrencySelector,
        WorkspaceLayout,
        WorkspaceStrip,
        NavigationPanel,
        ContentArea,
        DetailPanel,
        layoutStore,
        shortcutStore,
    } from "$lib/index.ts";

    import { appConfig } from "$lib/config";

    import AppStateInspector from "$lib/showcase/AppStateInspector.svelte";
    import Showcase from "$lib/showcase/Showcase.svelte";

    import { onMount } from "svelte";
    import { locales } from "$lib/paraglide/runtime";

    onMount(() => {
        appConfig.app.init({
            name: "Rune Lab Explorer",
            description: "Testing Svelte 5 Runes abstractions",
            version: "0.0.19",
        });

        appConfig.api.init("https://api.example.com", "v1");

        // Initialize layout state
        if (!layoutStore.activeWorkspaceId)
            layoutStore.activeWorkspaceId = "home";
        if (!layoutStore.activeNavItemId)
            layoutStore.activeNavItemId = "dashboard";

        // Custom shortcut for demo
        shortcutStore.register({
            id: "demo:hello",
            keys: "h",
            label: "Say Hello",
            category: "Demo",
            scope: "global",
            handler: () => appConfig.toast.info("Hello from Rune Lab!"),
        });
    });

    const workspaces = [
        {
            id: "home",
            icon: "🏠",
            label: "Home",
            onClick: () => (layoutStore.activeNavItemId = "dashboard"),
        },
        {
            id: "docs",
            icon: "📚",
            label: "Documentation",
            onClick: () => (layoutStore.activeNavItemId = "showcase"),
        },
        {
            id: "settings",
            icon: "⚙️",
            label: "Settings",
            onClick: () => (layoutStore.activeNavItemId = "dashboard"),
        },
        {
            id: "github",
            icon: "https://github.githubassets.com/favicons/favicon.svg",
            label: "GitHub",
            onClick: () =>
                window.open("https://github.com/Yrrrrrf/rune-lab", "_blank"),
        },
    ];

    // Derived sections to handle isActive state
    const sections = $derived([
        {
            id: "overview",
            title: "Overview",
            items: [
                {
                    id: "dashboard",
                    label: "Dashboard",
                    icon: "📊",
                    isActive: layoutStore.activeNavItemId === "dashboard",
                    onClick: () => (layoutStore.activeNavItemId = "dashboard"),
                },
            ],
        },
        {
            id: "library",
            title: "Component Library",
            items: [
                {
                    id: "showcase",
                    label: "Showcase",
                    icon: "🎨",
                    isActive: layoutStore.activeNavItemId === "showcase",
                    onClick: () => (layoutStore.activeNavItemId = "showcase"),
                },
                {
                    id: "shortcuts-demo",
                    label: "Shortcuts",
                    icon: "⌨️",
                    badge: "New",
                    isActive: layoutStore.activeNavItemId === "shortcuts-demo",
                    onClick: () =>
                        (layoutStore.activeNavItemId = "shortcuts-demo"),
                },
            ],
        },
    ]);
</script>

<WorkspaceLayout>
    {#snippet workspaceStrip()}
        <WorkspaceStrip items={workspaces}>
            {#snippet globalActions()}
                <button
                    onclick={() => layoutStore.toggleDetail()}
                    class="w-12 h-12 flex items-center justify-center rounded-[24px] hover:rounded-[16px] transition-all duration-200 bg-base-100/50 hover:bg-secondary hover:text-secondary-content"
                    title="Toggle Info"
                >
                    <span class="text-xl">ℹ️</span>
                </button>
            {/snippet}
        </WorkspaceStrip>
    {/snippet}

    {#snippet navigationPanel()}
        <NavigationPanel {sections}>
            {#snippet header()}
                <div class="flex items-center gap-2">
                    <img src="/img/rune.png" alt="Rune Lab" class="w-8 h-8" />
                    <span
                        class="font-black tracking-tighter text-lg uppercase italic"
                        >Explorer</span
                    >
                </div>
            {/snippet}
            {#snippet footer()}
                <div class="flex flex-col gap-2">
                    <LanguageSelector languages={[...locales]} />
                    <ThemeSelector />
                    <CurrencySelector />
                </div>
            {/snippet}
        </NavigationPanel>
    {/snippet}

    {#snippet content()}
        <ContentArea>
            {#snippet header()}
                <div class="flex items-center justify-between w-full">
                    <div class="flex items-center gap-2 text-sm">
                        <span class="opacity-40">Explorer</span>
                        <span class="opacity-20">/</span>
                        <span class="font-bold capitalize"
                            >{layoutStore.activeNavItemId}</span
                        >
                    </div>
                    <div class="flex items-center gap-4">
                        <div
                            class="flex items-center gap-1 opacity-40 text-[10px] font-mono"
                        >
                            <kbd class="kbd kbd-xs">?</kbd> for help
                        </div>
                    </div>
                </div>
            {/snippet}

            <div class="p-8 max-w-5xl mx-auto space-y-12">
                {#if layoutStore.activeNavItemId === "dashboard"}
                    <header class="space-y-4">
                        <div class="flex items-center gap-6">
                            <img
                                src="/img/rune.png"
                                alt="Rune Lab"
                                class="w-20 h-20 animate-pulse"
                            />
                            <div>
                                <h1
                                    class="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-primary to-secondary"
                                >
                                    {appConfig.app.name}
                                </h1>
                                <div class="flex items-center gap-2 mt-2">
                                    <span
                                        class="badge badge-outline border-base-content/20 font-mono text-xs"
                                        >v{appConfig.app.info.version}</span
                                    >
                                    <span class="badge badge-secondary badge-sm"
                                        >Dashboard</span
                                    >
                                </div>
                            </div>
                        </div>
                        <p class="text-xl opacity-60 leading-relaxed max-w-2xl">
                            Welcome to the Rune Lab Dashboard. This view
                            provides an overview of your application's reactive
                            state and health.
                        </p>
                    </header>
                    <AppStateInspector />
                {:else if layoutStore.activeNavItemId === "showcase"}
                    <header class="mb-8">
                        <h2 class="text-3xl font-bold tracking-tight">
                            Component Showcase
                        </h2>
                        <p class="opacity-50">
                            Explore the library of reactive UI components.
                        </p>
                    </header>
                    <Showcase />
                {:else if layoutStore.activeNavItemId === "shortcuts-demo"}
                    <header class="mb-8">
                        <h2 class="text-3xl font-bold tracking-tight">
                            Shortcut System
                        </h2>
                        <p class="opacity-50">
                            Manage and discover keyboard interactions.
                        </p>
                    </header>
                    <div class="card bg-base-200 p-8 text-center space-y-4">
                        <div class="text-5xl">⌨️</div>
                        <h3 class="text-xl font-bold">
                            Try pressing <kbd class="kbd">?</kbd>
                        </h3>
                        <p class="max-w-md mx-auto opacity-70">
                            The shortcut palette is a first-class citizen in
                            Rune Lab. Any component can register its own
                            shortcuts, and they will automatically appear in the
                            global directory.
                        </p>
                        <div class="flex justify-center gap-2 mt-4">
                            <button
                                onclick={() =>
                                    shortcutStore.register({
                                        id: "dynamic:toast",
                                        keys: "t",
                                        label: "Send Dynamic Toast",
                                        category: "Demo",
                                        scope: "global",
                                        handler: () =>
                                            appConfig.toast.success(
                                                "Dynamic shortcut fired!",
                                            ),
                                    })}
                                class="btn btn-primary"
                                >Register "T" Shortcut</button
                            >
                        </div>
                    </div>
                {/if}

                <div class="h-24"></div>
                <!-- Spacer -->
            </div>
        </ContentArea>
    {/snippet}

    {#snippet detailPanel()}
        <DetailPanel>
            <div class="space-y-6">
                <h3 class="text-lg font-bold">Contextual Info</h3>
                <div class="p-4 bg-base-200 rounded-xl space-y-2">
                    <p class="text-sm font-medium">Layout Stats</p>
                    <ul class="text-xs space-y-1 opacity-70">
                        <li>
                            Nav Panel: {layoutStore.navOpen ? "Open" : "Closed"}
                        </li>
                        <li>
                            Detail Panel: {layoutStore.detailOpen
                                ? "Open"
                                : "Closed"}
                        </li>
                        <li>
                            Active Workspace: {layoutStore.activeWorkspaceId ||
                                "None"}
                        </li>
                        <li>
                            Active View: {layoutStore.activeNavItemId || "None"}
                        </li>
                        <li>
                            Collapsed Sections: {layoutStore.collapsedSections
                                .size}
                        </li>
                    </ul>
                </div>

                <div
                    class="p-4 border border-base-content/5 rounded-xl space-y-2"
                >
                    <p class="text-sm font-medium">Keyboard Shortcuts</p>
                    <div class="flex flex-wrap gap-2">
                        <kbd class="kbd kbd-sm">?</kbd>
                        <kbd class="kbd kbd-sm">ctrl + \</kbd>
                        <kbd class="kbd kbd-sm">ctrl + k</kbd>
                    </div>
                </div>
            </div>
        </DetailPanel>
    {/snippet}
</WorkspaceLayout>

<ApiMonitor />
<Toaster />
