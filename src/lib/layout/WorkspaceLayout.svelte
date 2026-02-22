<!-- src/lib/layout/WorkspaceLayout.svelte -->
<script module lang="ts">
    import type { Snippet } from "svelte";

    export interface WorkspaceLayoutProps {
        /** Content for the far-left vertical strip */
        workspaceStrip?: Snippet;
        /** Main navigation tree panel */
        navigationPanel?: Snippet;
        /** The primary application view */
        content?: Snippet;
        /** Right-side contextual detail panel */
        detailPanel?: Snippet;
        namespace?: string;

        /** Width of the left workspace strip */
        stripWidth?: string;
        /** Width of the navigation tree panel */
        navWidth?: string;
        /** Width of the contextual detail panel */
        detailWidth?: string;

        /** Controlled override for navigation panel visibility */
        navOpen?: boolean;
        /** Controlled override for detail panel visibility */
        detailOpen?: boolean;
    }
</script>

<script lang="ts">
    import { getLayoutStore } from "$lib/state/layout.svelte";
    import {
        getShortcutStore,
        shortcutListener,
        LAYOUT_SHORTCUTS,
    } from "$lib/state/shortcuts.svelte";
    import { onMount } from "svelte";

    /**
     * @component WorkspaceLayout
     * The main application shell managing navigational zones.
     */
    const layoutStore = getLayoutStore();

    let {
        /** Content for the far-left vertical strip */
        workspaceStrip,
        /** Main navigation tree panel */
        navigationPanel,
        /** The primary application view */
        content,
        /** Right-side contextual detail panel */
        detailPanel,
        namespace = "default",

        /** Width of the left workspace strip */
        stripWidth = "72px",
        /** Width of the navigation tree panel */
        navWidth = "240px",
        /** Width of the contextual detail panel */
        detailWidth = "320px",

        /** Controlled override for navigation panel visibility */
        navOpen = $bindable(layoutStore.navOpen),
        /** Controlled override for detail panel visibility */
        detailOpen = $bindable(layoutStore.detailOpen),
    }: WorkspaceLayoutProps = $props();

    const shortcutStore = getShortcutStore();

    // Initial configuration based on props
    onMount(() => {
        layoutStore.init({ namespace });

        // Register default layout shortcuts
        const shortcuts = [
            {
                ...LAYOUT_SHORTCUTS.TOGGLE_NAV,
                handler: () => layoutStore.toggleNav(),
            },
            {
                ...LAYOUT_SHORTCUTS.TOGGLE_DETAIL,
                handler: () => layoutStore.toggleDetail(),
            },
            // Workspace shortcuts (ctrl+1 to ctrl+9)
            ...Array.from({ length: 9 }, (_, i) => ({
                ...(LAYOUT_SHORTCUTS as any)[`WORKSPACE_${i + 1}`],
                handler: () => layoutStore.activateWorkspaceByIndex(i),
            })),
        ];

        for (const s of shortcuts) {
            shortcutStore.register(s);
        }

        return () => {
            shortcutStore.unregister(LAYOUT_SHORTCUTS.TOGGLE_NAV.id);
            shortcutStore.unregister(LAYOUT_SHORTCUTS.TOGGLE_DETAIL.id);
            for (let i = 1; i <= 9; i++) {
                shortcutStore.unregister(
                    (LAYOUT_SHORTCUTS as any)[`WORKSPACE_${i}`].id,
                );
            }
        };
    });
</script>

<div
    class="rl-layout flex h-[100dvh] w-screen overflow-hidden bg-base-100 text-base-content font-sans relative"
    use:shortcutListener={shortcutStore}
    data-rl-layout
>
    <!-- Zone 1: Workspace Strip -->
    {#if workspaceStrip}
        <aside
            class="rl-strip h-full w-[var(--rl-strip-width,72px)] shrink-0 overflow-y-auto overflow-x-hidden bg-base-300 flex flex-col items-center py-3 gap-2 z-[60]"
        >
            {@render workspaceStrip()}
        </aside>
    {/if}

    <!-- Mobile Nav Backdrop -->
    {#if navigationPanel && navOpen}
        <button
            class="fixed inset-0 bg-black/50 md:hidden cursor-default border-none"
            style="z-index: var(--rl-z-backdrop, 40);"
            onclick={() => (navOpen = false)}
            aria-label="Close navigation"
        ></button>
    {/if}

    <!-- Zone 2: Navigation Panel -->
    {#if navigationPanel}
        <aside
            class="rl-nav h-full shrink-0 bg-base-200 overflow-hidden flex flex-col transition-all duration-300 ease-in-out"
            class:border-r={navOpen}
            class:border-base-content={true}
            style="
                border-opacity: 0.05;
                z-index: var(--rl-z-nav, 50);
                width: {navOpen ? 'var(--rl-nav-width, 240px)' : '0px'};
                left: {workspaceStrip ? 'var(--rl-strip-width, 72px)' : '0px'};
            "
            class:max-md:!w-[var(--rl-nav-width,240px)]={true}
            class:max-md:fixed={true}
            class:max-md:-translate-x-[200%]={!navOpen}
            data-rl-panel="navigation"
        >
            <div class="w-[var(--rl-nav-width,240px)] h-full flex flex-col">
                {@render navigationPanel()}
            </div>
        </aside>
    {/if}

    <!-- Zone 3: Main Content Area -->
    <main
        class="rl-content h-full flex-1 min-w-0 bg-base-100 flex flex-col overflow-hidden relative"
    >
        {#if content}
            {@render content()}
        {:else}
            <div></div>
        {/if}
    </main>

    <!-- Mobile Detail Backdrop -->
    {#if detailPanel && detailOpen}
        <button
            class="fixed inset-0 bg-black/50 md:hidden cursor-default border-none"
            style="z-index: var(--rl-z-backdrop, 40);"
            onclick={() => (detailOpen = false)}
            aria-label="Close detail panel"
        ></button>
    {/if}

    <!-- Zone 4: Detail Panel -->
    {#if detailPanel}
        <aside
            class="rl-detail h-full shrink-0 bg-base-100 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out"
            class:border-l={detailOpen}
            class:border-base-content={true}
            style="
                border-opacity: 0.05;
                z-index: var(--rl-z-detail, 50);
                width: {detailOpen ? 'var(--rl-detail-width, 320px)' : '0px'};
            "
            class:max-md:!w-[var(--rl-detail-width,320px)]={true}
            class:max-md:fixed={true}
            class:max-md:right-0={true}
            class:max-md:translate-x-[200%]={!layoutStore.detailOpen}
            data-rl-panel="detail"
        >
            <div class="w-[var(--rl-detail-width,320px)] h-full flex flex-col">
                {@render detailPanel()}
            </div>
        </aside>
    {/if}
</div>

<style>
    /* Global lock for entire screen, relying on WorkspaceLayout scroll areas */
    :global(html),
    :global(body) {
        overflow: hidden;
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
    }

    :global(.rl-layout) {
        --rl-strip-width: 72px;
        --rl-nav-width: 240px;
        --rl-detail-width: 320px;
    }

    /* Scrollbar styling */
    .rl-strip::-webkit-scrollbar,
    .rl-nav::-webkit-scrollbar,
    .rl-detail::-webkit-scrollbar {
        width: 4px;
    }

    .rl-strip::-webkit-scrollbar-thumb,
    .rl-nav::-webkit-scrollbar-thumb,
    .rl-detail::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 10px;
    }
</style>
