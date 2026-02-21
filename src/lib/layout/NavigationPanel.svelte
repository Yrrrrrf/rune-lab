<!-- src/lib/layout/NavigationPanel.svelte -->
<script lang="ts">
    import type { Snippet } from "svelte";
    import {
        getLayoutStore,
        type NavigationItem,
        type NavigationSection,
    } from "$lib/state/layout.svelte";
    import { page } from "$app/stores"; // Check if this is needed, or use layoutStore for active item

    let {
        header,
        sections = [],
        footer,
    } = $props<{
        header?: Snippet;
        sections: NavigationSection[];
        footer?: Snippet;
    }>();

    const layoutStore = getLayoutStore();

    function handleItemClick(item: NavigationItem) {
        if (item.id) layoutStore.navigate(item.id);
        item.onClick?.();
    }
</script>

<div class="flex flex-col h-full bg-base-200 text-base-content">
    {#if header}
        <div class="p-4 border-b border-base-content/10">
            {@render header()}
        </div>
    {/if}

    <div class="flex-1 overflow-y-auto">
        <ul class="menu menu-sm w-full p-2 gap-2">
            {#each sections as section (section.id)}
                <li>
                    <details
                        open={!layoutStore.collapsedSections.has(section.id)}
                        ontoggle={(e) => {
                            const open = (e.currentTarget as HTMLDetailsElement)
                                .open;
                            if (open) layoutStore.expandSection(section.id);
                            else layoutStore.collapseSection(section.id);
                        }}
                    >
                        <summary
                            class="font-bold text-xs uppercase tracking-wider text-base-content/60 hover:text-base-content"
                        >
                            {section.title}
                        </summary>
                        <ul>
                            {#each section.items as item (item.id)}
                                <!-- Recursive Render? Or simple list? Current structure suggests mostly 1 level deep inside section -->
                                <li>
                                    <button
                                        class:active={item.isActive !==
                                        undefined
                                            ? item.isActive
                                            : layoutStore.activeNavItemId ===
                                              item.id}
                                        onclick={() => handleItemClick(item)}
                                    >
                                        {#if item.icon}
                                            <span class="text-lg"
                                                >{item.icon}</span
                                            >
                                        {/if}
                                        <span class="flex-1">{item.label}</span>
                                        {#if item.badge}
                                            <span
                                                class="badge badge-sm badge-ghost"
                                                >{item.badge}</span
                                            >
                                        {/if}
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    </details>
                </li>
            {/each}
        </ul>
    </div>

    {#if footer}
        <div class="p-2 border-t border-base-content/10 bg-base-300/50">
            {@render footer()}
        </div>
    {/if}
</div>
