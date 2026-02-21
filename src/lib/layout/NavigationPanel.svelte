<!-- src/lib/layout/NavigationPanel.svelte -->
<script lang="ts">
    import type { Snippet } from "svelte";
    import type {
        NavigationItem,
        NavigationSection,
    } from "$lib/state/layout.svelte";

    let {
        header,
        sections = [],
        footer,
        activeId,
        collapsedIds = new Set(),
        onSelect,
        onToggle,
    } = $props<{
        header?: Snippet;
        sections: NavigationSection[];
        footer?: Snippet;
        activeId?: string | null;
        collapsedIds?: Set<string>;
        onSelect?: (item: NavigationItem) => void;
        onToggle?: (id: string, isOpen: boolean) => void;
    }>();

    function handleItemClick(item: NavigationItem) {
        onSelect?.(item);
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
                        open={!collapsedIds.has(section.id)}
                        ontoggle={(e) => {
                            const open = (e.currentTarget as HTMLDetailsElement)
                                .open;
                            onToggle?.(section.id, open);
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
                                            : activeId === item.id}
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
