<!-- src/lib/components/explorer/RLTableDisplay.svelte -->
<script lang="ts">
    import type { RLTableMetadata, RLEnumMetadata, RLColumnReference, RLColumnMetadata, RLPropertyItem  } from '$lib/components/stores/explorer.svelte'; //RLColumnMetadata is for the items
    import RLPropertyTable from '../common/RLPropertyTable.svelte';
    import RLApiInterface from '../api/RLApiInterface.svelte';

    let {
        table, // This is RLTableMetadata, its columns are RLColumnMetadata[]
        enumsInSchema = {},
        onFkClick,
        onEnumClick,
        onOpenApiModal,
    } = $props<{
        table: RLTableMetadata;
        enumsInSchema?: Record<string, RLEnumMetadata>;
        onFkClick: (ref: RLColumnReference) => void;
        onEnumClick: (enumData: RLEnumMetadata) => void;
        onOpenApiModal: (params: any) => void; // Adjust 'any' as needed
    }>();

    // Initial log to confirm props
    console.log('[RLTableDisplay] Props received for table:', table?.name, 'Columns count:', table?.columns?.length);

    // Transform RLColumnMetadata to RLPropertyItem (interface of RLPropertyTable)
    let propertyItems = $derived(
        table?.columns?.map((col: RLColumnMetadata) => ({ // col is RLColumnMetadata
            name: col.name,
            type: col.type, // This is the SQL type string
            nullable: col.nullable,
            isPrimaryKey: col.isPrimaryKey,
            isEnum: col.isEnum, // This is the crucial part for your enum badge
            references: col.references,
            mode: undefined, // RLPropertyItem fields
            hasDefault: undefined, // RLPropertyItem fields
            defaultValue: undefined, // RLPropertyItem fields
            _rawItem: col // Optional: pass original RLColumnMetadata
        })) || []
    );

    // Log derived propertyItems
    $effect(() => {
        console.log(`[RLTableDisplay] Derived propertyItems for table '${table?.name}'. Count: ${propertyItems?.length}`);
        if (propertyItems && propertyItems.length > 0) {
            // Log the item that corresponds to the 'status' column if this table is 'enrollment'
            if (table?.name === 'enrollment') {
                const statusItem = propertyItems.find((p: RLPropertyItem) => p.name === 'status');
                if (statusItem) {
                    console.log('[RLTableDisplay] "status" propertyItem for enrollment:', JSON.stringify(statusItem));
                } else {
                    console.log('[RLTableDisplay] "status" column not found in propertyItems for enrollment.');
                }
            }
        } else if (table?.columns?.length > 0) {
             console.warn(`[RLTableDisplay] propertyItems is empty or undefined for table '${table?.name}' but table.columns has items. Check the map function.`);
        }
    });

</script>

<div>
    <!-- Log right before RLPropertyTable is rendered -->
    {console.log(`[RLTableDisplay] Rendering RLPropertyTable for '${table?.name}' with ${propertyItems?.length} items.`)}

    <RLPropertyTable
        items={propertyItems}
        enumsInSchema={enumsInSchema}
        onFkClick={onFkClick}
        onEnumClick={onEnumClick}
        nameHeader="Column"
        detailHeader="Details"
        title={table?.name}
    />

    <div class="mt-4 p-2 border-t border-base-300/30">
        <RLApiInterface
            schemaName={table.schema}
            resourceName={table.name}
            resourceType={'table'}
            columns={table.columns.map((col: RLColumnMetadata) => ({...col}))}
            onOpenModal={(opParams) => onOpenApiModal({
                ...opParams,
                schemaName: table.schema,
                resourceName: table.name,
                resourceType: 'table',
                options: { columns: table.columns, enumsInSchema: enumsInSchema }
            })}
        />
    </div>
</div>