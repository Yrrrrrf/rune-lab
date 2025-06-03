<!-- src/lib/components/explorer/RLTableDisplay.svelte -->
<script lang="ts">
    import type { RLApiInterfaceActionParams, RLTableMetadata, RLEnumMetadata, RLColumnReference, RLColumnMetadata } from '$lib/components/stores/explorer.svelte';

    import RLMetadataTable from '../dataview/RLMetadataTable.svelte';
    import RLApiInterface from '../api/RLApiInterface.svelte';


    let {
        table,
        enumsInSchema = {},
        onFkClick,
        onEnumClick,
        onOpenApiModal,
    } = $props<{
        table: RLTableMetadata;
        enumsInSchema?: Record<string, RLEnumMetadata>;
        onFkClick: (ref: RLColumnReference) => void;
        onEnumClick: (enumData: RLEnumMetadata) => void; //RLMetadataTable onEnumClick now sends RLEnumMetadata
        onOpenApiModal: (params: RLApiInterfaceActionParams & { schemaName: string, resourceName: string, resourceType: 'table', options: any }) => void;
    }>();
</script>

<div>
    <RLMetadataTable
        title={table.name}
        itemType={'table'}
        columns={table.columns}
        enumsInSchema={enumsInSchema}
        onFkClick={onFkClick}
        onEnumClick={onEnumClick}
    />
    <div class="mt-4 p-2 border-t border-base-300/30">
        <RLApiInterface
            schemaName={table.schema}
            resourceName={table.name}
            resourceType={'table'}
            columns={table.columns}
            onOpenModal={(opParams) => onOpenApiModal({
                ...opParams,
                schemaName: table.schema,
                resourceName: table.name,
                resourceType: 'table',
                options: { columns: table.columns } // Passing RLColumnMetadata[]
            })}
        />
    </div>
</div>