<!-- src/lib/components/dataview/RLDetailRow.svelte -->
<script lang="ts">
    // No specific types needed from explorer.ts for these direct props.
    // This component is highly generic.

    type DetailAction = {
        text: string;
        class?: string;
        onClick?: (event: MouseEvent) => void;
        title?: string; // For tooltip on the badge/button
        isLink?: boolean; // To render as a link-styled button
    };

    let {
        name,
        typeInfo = undefined,
        details = [],
        required = false,
        description = undefined,
        nameClass = 'font-medium',
        typeInfoClass = 'font-mono text-xs text-base-content/60 italic mt-0.5',
        containerClass = 'flex justify-between items-baseline py-1.5 hover:bg-base-content/5 px-1 rounded group',
    } = $props<{
        name: string;
        typeInfo?: string;
        details?: DetailAction[];
        required?: boolean;
        description?: string;
        nameClass?: string;
        typeInfoClass?: string;
        containerClass?: string;
    }>();
</script>

<div class="{containerClass}" title={description}>
    <div class="flex-grow overflow-hidden pr-2">
        <span class="{nameClass}">{name}</span>
        {#if required}
            <span class="text-error ml-1 select-none" title="Required field">*</span>
        {/if}
        {#if typeInfo}
            <div class="{typeInfoClass} truncate" title={typeInfo}>{typeInfo}</div>
        {/if}
    </div>
    {#if details.length > 0}
        <div class="flex-shrink-0 space-x-1.5 flex items-center">
            {#each details as detailItem}
                <button
                    class="badge badge-sm whitespace-nowrap {detailItem.class || 'badge-ghost'} 
                           {detailItem.isLink ? 'link link-hover !text-info normal-case font-mono' : ''}
                           disabled:opacity-50"
                    onclick={detailItem.onClick}
                    title={detailItem.title || detailItem.text}
                    disabled={!detailItem.onClick && !detailItem.isLink}
                >
                    {@html detailItem.text} <!-- Use @html if text might contain simple entities like → -->
                </button>
            {/each}
        </div>
    {/if}
</div>