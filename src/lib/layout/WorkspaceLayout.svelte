<!-- src/lib/layout/WorkspaceLayout.svelte -->
<script lang="ts">
    import type { Snippet } from "svelte";
    import {
        createLayoutStore,
        getLayoutStore,
    } from "$lib/state/layout.svelte";
    import {
        getShortcutStore,
        shortcutListener,
        LAYOUT_SHORTCUTS,
    } from "$lib/state/shortcuts.svelte";
    import { onMount, setContext } from "svelte";

    let {
        workspaceStrip,
        navigationPanel,
        content,
        detailPanel,
        namespace = "default",
    } = $props<{
        workspaceStrip?: Snippet;
        navigationPanel?: Snippet;
        content: Snippet;
        detailPanel?: Snippet;
        namespace?: string;
    }>();

    // Consume layout store from context (provided by RuneProvider)
    const layoutStore = getLayoutStore();
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
    class="rl-layout h-screen w-screen grid overflow-hidden bg-base-100 text-base-content font-sans"
    style="
        grid-template-columns: 
            {workspaceStrip ? 'var(--rl-strip-width, 72px)' : '0px'} 
            {navigationPanel && layoutStore.navOpen
        ? 'var(--rl-nav-width, 240px)'
        : '0px'} 
            1fr 
            {detailPanel && layoutStore.detailOpen
        ? 'var(--rl-detail-width, 320px)'
        : '0px'};
        grid-template-rows: 100%;
        transition: grid-template-columns 300ms ease-in-out;
    "
    use:shortcutListener={shortcutStore}
    data-rl-layout
>
    <!-- Zone 1: Workspace Strip -->
    <aside
        class="rl-strip h-full overflow-y-auto overflow-x-hidden bg-base-300 flex flex-col items-center py-3 gap-2"
        class:hidden={!workspaceStrip}
    >
        {#if workspaceStrip}
            {@render workspaceStrip()}
        {/if}
    </aside>

    <!-- Zone 2: Navigation Panel -->
    <aside
        class="rl-nav h-full bg-base-200 border-base-content/5 overflow-hidden flex flex-col"
        class:hidden={!navigationPanel}
        class:border-r={layoutStore.navOpen}
        data-rl-panel="navigation"
    >
        {#if navigationPanel}
            {@render navigationPanel()}
        {/if}
    </aside>

    <!-- Zone 3: Main Content Area -->
    <main
        class="rl-content h-full min-w-0 bg-base-100 flex flex-col overflow-hidden relative"
    >
        {@render content()}
    </main>

    <!-- Zone 4: Detail Panel -->
    <aside
        class="rl-detail h-full bg-base-100 border-base-content/5 overflow-y-auto"
        class:hidden={!detailPanel}
        class:border-l={layoutStore.detailOpen}
        data-rl-panel="detail"
    >
        {#if detailPanel}
            {@render detailPanel()}
        {/if}
    </aside>
</div>

<style>
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
