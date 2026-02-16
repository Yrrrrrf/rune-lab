<!-- src/lib/layout/NavigationPanel.svelte -->
<script lang="ts">
    import type { Snippet } from "svelte";
    import {
        layoutStore,
        type NavigationSection,
        type NavigationItem,
    } from "$lib/state/layout.svelte";

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
</script>

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
                    <svg
                        class="w-3 h-3 transition-transform duration-200"
                        class:rotate-[-90deg]={layoutStore.collapsedSections.has(
                            section.id,
                        )}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                        stroke-linecap="round"
                        stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg
                    >
                </button>

                {#if !layoutStore.collapsedSections.has(section.id)}
                    <nav class="px-2 space-y-0.5">
                        {#each section.items as item}
                            <a
                                href={item.href || "javascript:void(0)"}
                                onclick={(e) => {
                                    if (!item.href) e.preventDefault();
                                    item.onClick?.();
                                }}
                                class="flex items-center gap-3 px-3 py-1.5 rounded-md text-sm font-medium transition-all group"
                                class:bg-primary={item.isActive}
                                class:text-primary-content={item.isActive}
                                class:hover:bg-base-300={!item.isActive}
                                class:opacity-60={!item.isActive}
                                class:hover:opacity-100={!item.isActive}
                            >
                                {#if item.icon}
                                    <span class="text-base">{item.icon}</span>
                                {/if}
                                <span class="flex-1 truncate">{item.label}</span
                                >
                                {#if item.badge}
                                    <span
                                        class="badge badge-sm opacity-50 border-none px-1.5 py-0 h-4 text-[10px]"
                                    >
                                        {item.badge}
                                    </span>
                                {/if}
                            </a>

                            {#if item.children && item.children.length > 0}
                                <div
                                    class="ml-6 pl-2 border-l border-base-content/5 mt-0.5 space-y-0.5"
                                >
                                    {#each item.children as child}
                                        <a
                                            href={child.href ||
                                                "javascript:void(0)"}
                                            onclick={(e) => {
                                                if (!child.href)
                                                    e.preventDefault();
                                                child.onClick?.();
                                            }}
                                            class="flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium opacity-50 hover:opacity-100 hover:bg-base-300 transition-all"
                                            class:text-primary={child.isActive}
                                            class:opacity-100={child.isActive}
                                        >
                                            {child.label}
                                        </a>
                                    {/each}
                                </div>
                            {/if}
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
<!-- 
<style>
    @import "daisyui/components/badge.css";
</style> -->
