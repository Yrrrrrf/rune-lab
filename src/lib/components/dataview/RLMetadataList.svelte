<!-- src/lib/components/dataview/RLMetadataList.svelte -->
<script lang="ts">
    import RLDetailRow from './RLDetailRow.svelte';

    type DetailActionForList = { // Prop structure for items passed to RLDetailRow
        text: string;
        class?: string;
        onClick?: (event: MouseEvent) => void;
        title?: string;
        isLink?: boolean;
    };

    export interface RLMetadataListItem {
        name: string;
        typeInfo?: string;
        details?: DetailActionForList[];
        required?: boolean;
        description?: string;
    }

    let {
        title = undefined,
        items = [],
        listClass = 'divide-y divide-base-300/50',
        emptyText = 'None.',
    } = $props<{
        title?: string;
        items: RLMetadataListItem[];
        listClass?: string;
        emptyText?: string;
    }>();
</script>

<div>
    {#if title}
        <h4 class="font-semibold text-sm mb-1 mt-2 opacity-80">{title}</h4>
    {/if}
    {#if items.length > 0}
        <div class="{listClass} border-t border-b border-base-300/30 -mx-1">
            {#each items as item (item.name) }
                <RLDetailRow
                    name={item.name}
                    typeInfo={item.typeInfo}
                    details={item.details}
                    required={item.required}
                    description={item.description}
                />
            {/each}
        </div>
    {:else}
        <p class="text-xs text-base-content/50 italic py-1.5 px-1">{emptyText}</p>
    {/if}
</div>