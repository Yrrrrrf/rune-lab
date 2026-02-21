<!-- src/lib/features/layout/smart/ConnectedNavigationPanel.svelte -->
<script lang="ts">
    import {
        getLayoutStore,
        type NavigationSection,
    } from "$lib/state/layout.svelte";
    import NavigationPanel from "$lib/layout/NavigationPanel.svelte";
    import type { Snippet } from "svelte";

    let { sections, header, footer } = $props<{
        sections: NavigationSection[];
        header?: Snippet;
        footer?: Snippet;
    }>();

    const layoutStore = getLayoutStore();
</script>

<NavigationPanel
    {sections}
    {header}
    {footer}
    activeId={layoutStore.activeNavItemId}
    collapsedIds={layoutStore.collapsedSections}
    onSelect={(item) => layoutStore.navigate(item.id!)}
    onToggle={(id, isOpen) =>
        isOpen
            ? layoutStore.expandSection(id)
            : layoutStore.collapseSection(id)}
/>
