<!-- src/lib/layout/WorkspaceStrip.svelte -->
<script lang="ts">
    import type { Snippet } from "svelte";
    import type { WorkspaceItem } from "$lib/state/layout.svelte";

    let {
        items = [],
        globalActions,
        activeId,
        onSelect,
    } = $props<{
        items: WorkspaceItem[];
        globalActions?: Snippet;
        activeId?: string | null;
        onSelect?: (id: string, item: WorkspaceItem) => void;
    }>();

    function handleWorkspaceClick(item: WorkspaceItem) {
        onSelect?.(item.id, item);
        item.onClick?.();
    }
</script>

<div class="flex flex-col gap-2 w-full items-center">
    {#each items as item}
        <div class="relative group flex items-center justify-center w-full">
            <!-- Discord-style active indicator -->
            <div
                class="absolute left-0 w-1 bg-base-content rounded-r-full transition-all duration-200"
                class:h-10={activeId === item.id}
                class:h-2={activeId !== item.id}
                class:opacity-100={activeId === item.id}
                class:opacity-0={activeId !== item.id}
            ></div>

            <button
                onclick={() => handleWorkspaceClick(item)}
                class="w-12 h-12 flex items-center justify-center rounded-[24px] hover:rounded-[16px] transition-all duration-200 bg-base-100 group-hover:bg-primary group-hover:text-primary-content shadow-sm overflow-hidden"
                class:rounded-[16px]={activeId === item.id}
                class:bg-primary={activeId === item.id}
                class:text-primary-content={activeId === item.id}
                title={item.label}
            >
                {#if item.icon.startsWith("http") || item.icon.startsWith("/")}
                    <img
                        src={item.icon}
                        alt={item.label}
                        class="w-full h-full object-cover"
                    />
                {:else}
                    <span class="text-xl">{item.icon}</span>
                {/if}

                {#if item.badge}
                    <span
                        class="absolute -top-1 -right-1 badge badge-error badge-xs border-none text-[10px] font-bold p-1"
                    >
                        {item.badge}
                    </span>
                {/if}
            </button>
        </div>
    {/each}

    <div class="divider px-4 my-1 opacity-10"></div>

    {#if globalActions}
        <div class="flex flex-col gap-2 w-full items-center mt-auto pb-4">
            {@render globalActions()}
        </div>
    {/if}
</div>
