<!-- src/lib/features/layout/smart/ConnectedNavigationPanel.svelte -->
<script lang="ts">
    import { getLayoutStore, type NavigationSection } from "@rune-lab/state";
    import NavigationPanel from "./NavigationPanel.svelte";
    import { createNavigationConnection } from "./connection-factory.ts";
    import type { Snippet } from "svelte";

    let { sections, header, footer } = $props<{
        sections: NavigationSection[];
        header?: Snippet;
        footer?: Snippet;
    }>();

    const layoutStore = getLayoutStore();
    const connection = createNavigationConnection(layoutStore);
</script>

<NavigationPanel
    {sections}
    {header}
    {footer}
    activeId={connection.activeId}
    collapsedIds={connection.collapsedIds}
    onSelect={connection.onSelect}
    onToggle={connection.onToggle}
/>
