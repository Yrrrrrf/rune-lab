<!-- src/lib/components/dataview/RLMetadataTable.svelte -->
<script lang="ts">
    import type { ColumnMetadata, ColumnReference } from '@yrrrrrf/prism-ts';

    let {
        title,
        itemType, // 'table' | 'view'
        columns
    } = $props<{
        title: string;
        itemType: 'table' | 'view';
        columns: ColumnMetadata[];
    }>();

    // Helper function to format references
    function formatReference(ref: ColumnReference | undefined): string {
        if (!ref) return '';
        return `${ref.schema}.${ref.table}.${ref.column}`;
    }
</script>

<div class="card bg-base-100 shadow-xl overflow-hidden">
    <div class="card-body p-0">
        <div class="p-4 border-b border-base-300">
            <h3 class="card-title flex justify-between items-center">
                <span class="text-lg font-semibold">{title}</span>
                <span class="badge badge-primary badge-outline">{itemType}</span>
            </h3>
        </div>
        {#if columns && columns.length > 0}
            <div class="overflow-x-auto">
                <table class="table table-sm table-zebra w-full">
                    <thead>
                        <tr>
                            <th>Column Name</th>
                            <th>Data Type</th>
                            <th class="text-center">Nullable</th>
                            <th class="text-center">Key</th>
                            <th>References</th>
                            <th class="text-center">Enum?</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each columns as column}
                            <tr class="hover">
                                <td class="font-medium">{column.name}</td>
                                <td class="font-mono text-xs">{column.type}</td>
                                <td class="text-center">
                                    {#if column.nullable}
                                        <span class="text-success">✓</span>
                                    {:else}
                                        <span class="text-error">✗</span>
                                    {/if}
                                </td>
                                <td class="text-center">
                                    {#if column.isPrimaryKey}
                                        <span class="badge badge-accent badge-sm font-semibold">PK</span>
                                    {:else if column.references}
                                        <span class="badge badge-secondary badge-sm">FK</span>
                                    {/if}
                                </td>
                                <td class="font-mono text-xs text-neutral-content/70">
                                    {formatReference(column.references)}
                                </td>
                                <td class="text-center">
                                    {#if column.isEnum}
                                        <span class="badge badge-warning badge-sm">Yes</span>
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {:else}
            <div class="p-4 text-center text-neutral-content/70">
                No columns defined for this {itemType}.
            </div>
        {/if}
    </div>
</div>