<!-- src/lib/components/api/RLApiInterface.svelte -->
<script lang="ts">
    import type { ColumnMetadata as PrismColumnMetadata } from '@yrrrrrf/prism-ts';
    // Import RLApiInterfaceActionParams from YOUR definition in the explorer store
    import type { RLApiInterfaceActionParams } from '$lib/components/stores/explorer.svelte.ts';

    // For convenience within this component, you can extract the operation type.
    // This is NOT redefining it; it's creating a local alias to a part of an imported type.
    type LocalAPIOperation = RLApiInterfaceActionParams['operation'];

    let {
        schemaName,
        resourceName,
        resourceType,
        columns,
        onOpenModal
    } = $props<{
        schemaName: string;
        resourceName: string;
        resourceType: 'table' | 'view' | 'function';
        columns: PrismColumnMetadata[]; // This prop is fine if it's what the component receives
        onOpenModal: (params: RLApiInterfaceActionParams) => void; // Uses your imported interface
    }>();

    // Use the local alias or RLApiInterfaceActionParams['operation']
    function getAllowedOps(type: 'table' | 'view' | 'function'): LocalAPIOperation[] {
        if (type === 'table') return ['GET', 'POST', 'PUT', 'DELETE'];
        if (type === 'view') return ['GET'];
        if (type === 'function') return ['POST'];
        return [];
    }

    const operationDetails: Record<LocalAPIOperation, { label: string, class: string }> = {
        GET: { label: 'GET', class: 'btn-info' },
        POST: { label: 'POST', class: 'btn-success' },
        PUT: { label: 'PUT', class: 'btn-warning' },
        DELETE: { label: 'DELETE', class: 'btn-error' },
    };

    function handleOperationClick(operation: LocalAPIOperation) {
        // Construct the object that matches RLApiInterfaceActionParams
        onOpenModal({ operation });
    }
</script>

<div class="flex flex-wrap gap-2 my-2">
    {#each getAllowedOps(resourceType) as operation}
        {@const detail = operationDetails[operation]}
        {#if detail}
            <button
                class="btn btn-sm {detail.class}"
                onclick={() => handleOperationClick(operation)}
            >
                {detail.label}
            </button>
        {/if}
    {/each}
</div>