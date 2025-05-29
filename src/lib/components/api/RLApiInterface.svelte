<!-- src/lib/components/api/RLApiInterface.svelte -->
<script lang="ts">
    import type { ColumnMetadata } from '@yrrrrrf/prism-ts';
    type APIOperation = 'GET' | 'POST' | 'PUT' | 'DELETE';

    let {
        schemaName,
        resourceName,
        resourceType,
        columns,
        onOpenModal // <-- ADDED THIS PROP
    } = $props<{
        schemaName: string;
        resourceName: string;
        resourceType: 'table' | 'view' | 'function'; // Added 'function' for future
        columns: ColumnMetadata[]; // Still relevant for tables/views context
        onOpenModal: (params: { operation: APIOperation }) => void; // <-- TYPE FOR THE PROP
    }>();

    function getAllowedOps(type: 'table' | 'view' | 'function'): APIOperation[] {
        if (type === 'table') return ['GET', 'POST', 'PUT', 'DELETE'];
        if (type === 'view') return ['GET'];
        if (type === 'function') return ['POST']; // Typical for functions
        return [];
    }

    const operationDetails: Record<APIOperation, { label: string, class: string }> = {
        GET: { label: 'GET', class: 'btn-info' },
        POST: { label: 'POST', class: 'btn-success' },
        PUT: { label: 'PUT', class: 'btn-warning' },
        DELETE: { label: 'DELETE', class: 'btn-error' },
    };

    function handleOperationClick(operation: APIOperation) {
        onOpenModal({ operation });
    }

</script>

<div class="flex flex-wrap gap-2 my-2">
    {#each getAllowedOps(resourceType) as operation}
        {@const detail = operationDetails[operation]}
        {#if detail} <!-- Added a check in case an operation is not in details -->
            <button
                class="btn btn-sm {detail.class}"
                onclick={() => handleOperationClick(operation)}
            >
                {detail.label}
            </button>
        {/if}
    {/each}
</div>