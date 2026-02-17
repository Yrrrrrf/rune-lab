<!-- src/lib/layout/WorkspaceLayout.svelte -->
<script lang="ts">
    import type { Snippet } from "svelte";
    import { layoutStore } from "$lib/state/layout.svelte";
    import { shortcutStore, shortcutListener, LAYOUT_SHORTCUTS } from "$lib/state/shortcuts.svelte";
    import { onMount } from "svelte";

    let { 
        workspaceStrip, 
        navigationPanel, 
        content, 
        detailPanel,
        namespace = "default"
    } = $props<{
        workspaceStrip: Snippet;
        navigationPanel: Snippet;
        content: Snippet;
        detailPanel?: Snippet;
        namespace?: string;
    }>();

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
                shortcutStore.unregister((LAYOUT_SHORTCUTS as any)[`WORKSPACE_${i}`].id);
            }
        };
    });
</script>

<div 
    class="rl-layout h-screen w-screen flex overflow-hidden bg-base-100 text-base-content font-sans"
    use:shortcutListener
    data-rl-layout
>
    <!-- Zone 1: Workspace Strip -->
    <aside class="rl-strip h-full flex-none overflow-y-auto overflow-x-hidden bg-base-300 flex flex-col items-center py-3 gap-2" style="width: var(--rl-strip-width, 72px)">
        {@render workspaceStrip()}
    </aside>

    <!-- Zone 2: Navigation Panel -->
    <aside 
        class="rl-nav h-full flex-none bg-base-200 border-r border-base-content/5 transition-all duration-300 ease-in-out overflow-hidden flex flex-col"
        class:w-0={!layoutStore.navOpen}
        class:opacity-0={!layoutStore.navOpen}
        style="width: {layoutStore.navOpen ? 'var(--rl-nav-width, 240px)' : '0'}"
        data-rl-panel="navigation"
    >
        {@render navigationPanel()}
    </aside>

    <!-- Zone 3: Main Content Area -->
    <main class="rl-content flex-1 h-full min-w-0 bg-base-100 flex flex-col overflow-hidden">
        {@render content()}
    </main>

    <!-- Zone 4: Detail Panel -->
    {#if detailPanel && layoutStore.detailOpen}
        <aside 
            class="rl-detail h-full flex-none bg-base-100 border-l border-base-content/5 transition-all duration-300 ease-in-out overflow-y-auto"
            style="width: var(--rl-detail-width, 320px)"
            data-rl-panel="detail"
        >
            {@render detailPanel()}
        </aside>
    {/if}
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
