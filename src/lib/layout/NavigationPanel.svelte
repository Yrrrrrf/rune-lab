<!-- src/lib/layout/NavigationPanel.svelte -->
<script lang="ts">
    import type { Snippet } from "svelte";
    import {
        layoutStore,
        type NavigationSection,
        type NavigationItem,
    } from "$lib/state/layout.svelte";

    import { Icon } from "$lib/index";

    let {
        header,
        sections = [],
        footer,
    } = $props<{
        header?: Snippet;
        sections: NavigationSection[];
        footer?: Snippet;
    }>();

    function toggleSection(id: string) {
        layoutStore.toggleSection(id);
    }

    function handleItemClick(item: NavigationItem) {
        layoutStore.navigate(item.id);
        item.onClick?.();
    }
</script>

{#snippet navItem(item: NavigationItem, isChild = false)}
    {@const isActive = layoutStore.activeNavItemId === item.id}
    
    {#if item.href}
        <a
            href={item.href}
            onclick={() => handleItemClick(item)}
            class="flex items-center gap-3 px-3 py-1.5 rounded-md transition-all group {isChild ? 'text-xs opacity-50 hover:opacity-100' : 'text-sm font-medium'}"
            class:bg-primary={isActive && !isChild}
            class:text-primary-content={isActive && !isChild}
            class:text-primary={isActive && isChild}
            class:opacity-100={isActive && isChild}
            class:hover:bg-base-300={!isActive}
            class:opacity-60={!isActive && !isChild}
            class:hover:opacity-100={!isActive && !isChild}
        >
            {#if item.icon && !isChild}
                <span class="text-base">{item.icon}</span>
            {/if}
            <span class="flex-1 truncate">{item.label}</span>
            {#if item.badge}
                <span class="badge badge-sm opacity-50 border-none px-1.5 py-0 h-4 text-[10px]">
                    {item.badge}
                </span>
            {/if}
        </a>
    {:else}
        <button
            onclick={() => handleItemClick(item)}
            class="flex items-center gap-3 px-3 py-1.5 rounded-md transition-all group w-full text-left {isChild ? 'text-xs opacity-50 hover:opacity-100' : 'text-sm font-medium'}"
            class:bg-primary={isActive && !isChild}
            class:text-primary-content={isActive && !isChild}
            class:text-primary={isActive && isChild}
            class:opacity-100={isActive && isChild}
            class:hover:bg-base-300={!isActive}
            class:opacity-60={!isActive && !isChild}
            class:hover:opacity-100={!isActive && !isChild}
        >
            {#if item.icon && !isChild}
                <span class="text-base">{item.icon}</span>
            {/if}
            <span class="flex-1 truncate">{item.label}</span>
            {#if item.badge}
                <span class="badge badge-sm opacity-50 border-none px-1.5 py-0 h-4 text-[10px]">
                    {item.badge}
                </span>
            {/if}
        </button>
    {/if}

    {#if item.children && item.children.length > 0}
        <div class="ml-6 pl-2 border-l border-base-content/5 mt-0.5 space-y-0.5">
            {#each item.children as child}
                {@render navItem(child, true)}
            {/each}
        </div>
    {/if}
{/snippet}

{#if header}
    <header class="p-4 border-b border-base-content/5">
        {@render header()}
    </header>
{/if}

<div class="flex-1 overflow-y-auto py-4">
    <div class="space-y-6">
        {#each sections as section}
            <div class="space-y-1">
                <button
                    onclick={() => toggleSection(section.id)}
                    class="flex items-center justify-between w-full px-4 text-xs font-black uppercase tracking-widest text-base-content/40 hover:text-base-content/70 transition-colors group"
                >
                    <span>{section.title}</span>
                    <Icon
                        name="chevron-down"
                        class="w-3 h-3 transition-transform duration-200 {layoutStore.collapsedSections.has(section.id) ? 'rotate-[-90deg]' : ''}"
                    />
                </button>

                {#if !layoutStore.collapsedSections.has(section.id)}
                    <nav class="px-2 space-y-0.5">
                        {#each section.items as item}
                            {@render navItem(item)}
                        {/each}
                    </nav>
                {/if}
            </div>
        {/each}
    </div>
</div>

{#if footer}
    <footer class="p-4 bg-base-300/30 border-t border-base-content/5">
        {@render footer()}
    </footer>
{/if}
