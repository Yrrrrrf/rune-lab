<!-- src/lib/components/api/RLApiInterface.svelte -->
<script lang="ts">
    import type { ColumnMetadata } from '@yrrrrrf/prism-ts';

    // Assuming APIOperation is defined in a shared types file or imported
    // For example: import type { APIOperation } from '$lib/types/common';
    type APIOperation = 'GET' | 'POST' | 'PUT' | 'DELETE'; // Keep local if not shared

    let {
        schemaName,
        resourceName,
        resourceType, // 'table' | 'view' | 'function' (add function later)
        columns,
        // NEW PROP: Callback to open the modal
        onOpenModal
    } = $props<{
        schemaName: string;
        resourceName: string;
        resourceType: 'table' | 'view'; // Extend for functions later
        columns: ColumnMetadata[];
        onOpenModal: (params: {
            operation: APIOperation;
            // schemaName, resourceName, resourceType, columns are already available via props
        }) => void;
    }>();

    function getAllowedOps(type: 'table' | 'view'): APIOperation[] {
        if (type === 'table') return ['GET', 'POST', 'PUT', 'DELETE'];
        if (type === 'view') return ['GET'];
        // Add 'function' handling later: if (type === 'function') return ['POST'];
        return [];
    }

    const operationDetails: Record<APIOperation, { label: string, class: string }> = {
        GET: { label: 'GET', class: 'btn-info' },
        POST: { label: 'POST', class: 'btn-success' },
        PUT: { label: 'PUT', class: 'btn-warning' },
        DELETE: { label: 'DELETE', class: 'btn-error' },
    };

    function handleOperationClick(operation: APIOperation) {
        // Call the parent's function to open the modal
        onOpenModal({ operation });
    }

</script>

<div class="flex flex-wrap gap-2 my-2">
    {#each getAllowedOps(resourceType) as operation}
        {@const detail = operationDetails[operation]}
        <button
            class="btn btn-sm {detail.class}"
            onclick={() => handleOperationClick(operation)}
        >
            {detail.label}
            <!-- <span class="hidden sm:inline ml-1">{resourceName}</span> -->
        </button>
    {/each}
</div>