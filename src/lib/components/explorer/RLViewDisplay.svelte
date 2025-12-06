<!-- src/lib/components/explorer/RLViewDisplay.svelte -->
<script lang="ts">
    import type { RLApiInterfaceActionParams, RLViewMetadata, RLEnumMetadata, RLColumnMetadata } from '$lib/components/stores/explorer.svelte';

    import RLMetadataTable from '../dataview/RLMetadataTable.svelte';
    import RLApiInterface from '../api/RLApiInterface.svelte';


    let {
        view,
        enumsInSchema = {},
        onEnumClick, // Views might have enum-typed columns
        onOpenApiModal,
    } = $props<{
        view: RLViewMetadata;
        enumsInSchema?: Record<string, RLEnumMetadata>;
        onEnumClick: (enumData: RLEnumMetadata) => void;
        onOpenApiModal: (params: RLApiInterfaceActionParams & { schemaName: string, resourceName: string, resourceType: 'view', options: any }) => void;
    }>();
</script>

<div>
    <RLMetadataTable
        title={view.name}
        itemType={'view'}
        columns={view.columns}
        enumsInSchema={enumsInSchema}
        onEnumClick={onEnumClick}
        onFkClick={() => {}}
    />
    <div class="mt-4 p-2 border-t border-base-300/30">
        <RLApiInterface
            schemaName={view.schema}
            resourceName={view.name}
            resourceType={'view'}
            columns={view.columns}
            onOpenModal={(opParams) => onOpenApiModal({
                ...opParams,
                schemaName: view.schema,
                resourceName: view.name,
                resourceType: 'view',
                options: { columns: view.columns } // Passing RLColumnMetadata[]
            })}
        />
    </div>
</div>