<!-- src/lib/components/common/RLPropertyTable.svelte (example structure) -->
<script lang="ts">
    import type { RLEnumMetadata, RLColumnReference } from '$lib/components/stores/explorer.svelte';

    export interface RLPropertyItem {
        name: string;
        type?: string;
        nullable?: boolean;
        isPrimaryKey?: boolean;
        references?: RLColumnReference;
        isEnum?: boolean;
        mode?: string; // For function params
        hasDefault?: boolean;
        defaultValue?: string | null;
        // Any other properties needed to render details
        _rawItem?: any; // Optional: pass the original item if needed by slot
    }

    let {
        items,
        title = '',
        nameHeader = "Name",
        detailHeader = "Details",
        enumsInSchema, // Pass this if needed for enum badge clicks from here
        onFkClick,
        onEnumClick,
    } = $props<{
        items: RLPropertyItem[];
        title?: string;
        nameHeader?: string;
        detailHeader?: string;
        enumsInSchema?: Record<string, RLEnumMetadata>; // For resolving enum names if items only have partial enum info
        onFkClick?: (ref: RLColumnReference) => void;
        onEnumClick?: (enumData: RLEnumMetadata) => void;
    }>();
</script>

<div class="card bg-base-100 shadow-sm overflow-hidden my-2">
    {#if title}
        <div class="card-title p-3 text-sm font-semibold bg-base-200/50">{title}</div>
    {/if}
    <div class="card-body p-0">
        {#if items && items.length > 0}
            <div class="overflow-x-auto">
                <table class="table table-sm w-full">
                    <thead>
                        <tr>
                            <th class="w-2/5 pl-4">{nameHeader}</th>
                            {#if detailHeader} <th class="w-3/5 pr-4">{detailHeader}</th> {/if}
                        </tr>
                    </thead>
                    <tbody>
                        {#each items as item (item.name)}
                            <tr class="hover">
                                <td class="align-top py-2 pl-4">
                                    <div class="flex items-baseline">
                                        <span class="font-medium">{item.name}</span>
                                        {#if item.nullable === false && item.type && !item.type.toLowerCase().includes('bool')} <!-- Nullability for non-booleans -->
                                            <span class="text-error ml-1 select-none" title="Required field">*</span>
                                        {/if}
                                    </div>
                                    {#if item.type && detailHeader} <!-- Only show type if details are shown and type exists -->
                                        <div class="font-mono text-xs text-base-content/60 italic mt-0.5">{item.type}</div>
                                    {/if}
                                </td>
                                {#if detailHeader}
                                <td class="align-top py-2 pr-4 space-x-1.5">
                                    {#if $$slots.detail}
                                        <slot name="detail" itemData={item}></slot>
                                    {:else}
                                        <!-- Default detail rendering -->
                                        {#if item.isPrimaryKey} <span class="badge badge-accent badge-xs font-semibold">PK</span> {/if}
                                        {#if item.references}
                                            <span class="badge badge-secondary badge-xs">FK</span>
                                            <button class="link link-hover text-xs font-mono !text-info normal-case"
                                                onclick={() => onFkClick && onFkClick(item.references!)}
                                                title="Navigate to {item.references.schema}.{item.references.table}.{item.references.column}">
                                                {item.references.schema}.{item.references.table}.{item.references.column}
                                            </button>
                                        {/if}
                                        {#if item.isEnum && enumsInSchema && enumsInSchema[item.name + '_enum'] /* Crude example of finding enum */}
                                            {@const enumMeta = enumsInSchema[item.name + '_enum']}
                                             <button class="badge badge-warning badge-xs hover:shadow-md transition-shadow normal-case"
                                                onclick={() => onEnumClick && onEnumClick(enumMeta)}
                                                title="Enum: {enumMeta.name}">
                                                <span class="mr-1 opacity-70">Enum:</span>{enumMeta.name}
                                            </button>
                                        {:else if item.isEnum}
                                            <span class="badge badge-ghost badge-xs">Enum</span>
                                        {/if}
                                        {#if item.mode} <span class="badge badge-info badge-xs">{item.mode}</span> {/if}
                                        {#if item.hasDefault} <span class="badge badge-outline badge-xs" title="Default: {item.defaultValue}">Has Default</span> {/if}
                                    {/if}
                                </td>
                                {/if}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {:else}
            <div class="p-4 text-center text-neutral-content/70">
                No items to display.
            </div>
        {/if}
    </div>
</div>