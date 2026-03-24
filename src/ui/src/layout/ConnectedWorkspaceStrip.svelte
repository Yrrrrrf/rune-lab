<!-- src/lib/features/layout/smart/ConnectedWorkspaceStrip.svelte -->
<script lang="ts">
    import { getLayoutStore, type WorkspaceItem } from "@internal/state";
    import WorkspaceStrip from "./WorkspaceStrip.svelte";
    import { createWorkspaceConnection } from "./connection-factory.ts";
    import type { Snippet } from "svelte";

    let { items, globalActions } = $props<{
        items: WorkspaceItem[];
        globalActions?: Snippet;
    }>();

    const layoutStore = getLayoutStore();
    const connection = createWorkspaceConnection(layoutStore);
</script>

<WorkspaceStrip
    {items}
    {globalActions}
    activeId={connection.activeId}
    onSelect={connection.onSelect}
/>
