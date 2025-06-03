<!-- src/lib/components/explorer/RLFunctionDisplay.svelte -->
<script lang="ts">
    import type { RLApiInterfaceActionParams, RLFunctionMetadata, RLFunctionParameter } from '$lib/components/stores/explorer.svelte';

    import RLDetailRow from '../dataview/RLDetailRow.svelte';
    import RLMetadataList from '../dataview/RLMetadataList.svelte';
    import type { RLMetadataListItem } from '../dataview/RLMetadataList.svelte';
    import RLApiInterface from '../api/RLApiInterface.svelte'; // For execution

    let {
        func,
        onOpenApiModal, // Callback to RLSchemaExplorer
    } = $props<{
        func: RLFunctionMetadata;
        onOpenApiModal: (params: RLApiInterfaceActionParams & { schemaName: string, resourceName: string, resourceType: 'function', options: any }) => void;
    }>();

    let parameterItems = $derived(
        func.parameters.map((param: RLFunctionParameter): RLMetadataListItem => ({
            name: param.name,
            typeInfo: param.type + (param.defaultValue ? ` (default: ${param.defaultValue})` : ''),
            required: !param.hasDefault && param.mode === 'IN', // Only IN params can be "required" in a form sense
            details: [{ text: param.mode, class: `badge-${param.mode === 'IN' ? 'info' : param.mode === 'OUT' ? 'success' : 'warning'}` }],
        }))
    );
</script>

<div class="space-y-3 py-2">
    {#if func.description}
        <RLDetailRow name="Description" typeInfo={func.description} nameClass="font-semibold opacity-80" typeInfoClass="italic text-sm" />
    {/if}

    <RLDetailRow name="Kind" typeInfo={func.kind} nameClass="font-semibold opacity-80" />
    <RLDetailRow name="Return Type" typeInfo={func.returnType || 'void'} nameClass="font-semibold opacity-80" />
    <RLDetailRow name="Is Strict" typeInfo={func.isStrict ? 'Yes' : 'No'} nameClass="font-semibold opacity-80" />

    {#if func.kind === 'TRIGGER' && func.triggerData}
        <RLMetadataList title="Trigger Details" items={[
            { name: 'Timing', typeInfo: func.triggerData.timing },
            { name: 'Events', typeInfo: func.triggerData.events.join(', ') },
            { name: 'Target', typeInfo: `${func.triggerData.targetTableSchema}.${func.triggerData.targetTableName}` },
        ]} />
    {/if}

    <RLMetadataList items={parameterItems} title="Parameters" emptyText="No parameters." />

    {#if (func.kind === 'FUNCTION' || func.kind === 'PROCEDURE') && onOpenApiModal}
        <div class="mt-4 pt-3 border-t border-base-300/30">
             <RLApiInterface
                schemaName={func.schema}
                resourceName={func.name}
                resourceType={'function'} 
                columns={[]}
                onOpenModal={(opParams) => onOpenApiModal({
                    ...opParams, 
                    schemaName: func.schema, 
                    resourceName: func.name, 
                    resourceType: 'function', 
                    options: { functionParams: func.parameters } // Passing RLFunctionParameter[]
                })}
            />
        </div>
    {/if}
</div>