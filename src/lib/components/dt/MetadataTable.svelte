<!-- src/lib/components/dt/MetadataTable.svelte -->
<script lang="ts">
    import type { ColumnMetadata, ColumnRef } from 'ts-forge';

    let { title, type, columns } = $props<{
        title: string;
        type: string;
        columns: ColumnMetadata[];
    }>();

    // Helper function to format references
    function formatReference(ref: ColumnRef | undefined): string {
        if (!ref) return '';
        return `${ref.schema}.${ref.table}.${ref.column}`;
    }

    // console.log(columns);
</script>

<div class="card bg-base-100 shadow-xl">
    <div class="card-body">
        <h3 class="card-title flex justify-between">
            <span>{title}</span>
            <span class="badge badge-primary">{type}</span>
        </h3>
        <div class="overflow-x-auto">
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Column</th>
                        <th>Type</th>
                        <th class="text-center">Nullable</th>
                        <th class="text-center">Key</th>
                        <th>References</th>
                    </tr>
                </thead>
                <tbody>
                    {#each columns as column}
                        <tr class="hover">
                            <td>{column.name}</td>
                            <td class="font-mono text-sm">
                                {#if column.is_enum}
                                    <span class="badge badge-warning">ENUM</span> {column.name}
                                {:else}
                                    {column.type}
                                {/if}
                            </td>
                            <td class="text-center">
                                {#if column.nullable}
                                    <span class="text-success">✓</span>
                                {:else}
                                    <span class="text-error">✗</span>
                                {/if}
                            </td>
                            <td class="text-center">
                                {#if column.is_pk}
                                    <span class="badge badge-primary badge-sm">PK</span>
                                {:else if column.references}
                                    <span class="badge badge-secondary badge-sm">FK</span>
                                {/if}
                            </td>
                            <td class="text-sm text-gray-600">
                                {formatReference(column.references)}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div>
