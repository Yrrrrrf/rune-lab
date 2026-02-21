<!-- src/lib/features/layout/smart/ConnectedWorkspaceStrip.svelte -->
<script lang="ts">
    import {
        getLayoutStore,
        type WorkspaceItem,
    } from "$lib/state/layout.svelte";
    import WorkspaceStrip from "$lib/layout/WorkspaceStrip.svelte";
    import type { Snippet } from "svelte";

    let { items, globalActions } = $props<{
        items: WorkspaceItem[];
        globalActions?: Snippet;
    }>();

    const layoutStore = getLayoutStore();
</script>

<WorkspaceStrip
    {items}
    {globalActions}
    activeId={layoutStore.activeWorkspaceId}
    onSelect={(id) => layoutStore.activateWorkspace(id)}
/>
