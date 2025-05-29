<!-- src/lib/components/api/RLApiInterface.svelte -->
<script lang="ts">
    import type { ColumnMetadata } from '@yrrrrrf/prism-ts';
    // Assuming APIOperation is defined/exported from a common types file or locally
    // For now, let's define it locally for simplicity if not already in $lib/types/common.ts
    type APIOperation = 'GET' | 'POST' | 'PUT' | 'DELETE';
    import RLApiOperationModal from './RLApiOperationModal.svelte';

    let {
        schemaName,
        resourceName,
        resourceType, // 'table' | 'view'
        columns
    } = $props<{
        schemaName: string;
        resourceName: string;
        resourceType: 'table' | 'view';
        columns: ColumnMetadata[];
    }>();

    let showModal = $state(false);
    let selectedOperation = $state<APIOperation | null>(null);
    let recordIdForUpdateOrDelete = $state<string | number | null>(null); // For specific record operations

    function getAllowedOps(type: 'table' | 'view'): APIOperation[] {
        if (type === 'table') return ['GET', 'POST', 'PUT', 'DELETE'];
        if (type === 'view') return ['GET'];
        return [];
    }

    const operationDetails: Record<APIOperation, { label: string, class: string }> = {
        GET: { label: 'GET', class: 'btn-info' },
        POST: { label: 'POST', class: 'btn-success' },
        PUT: { label: 'PUT', class: 'btn-warning' },
        DELETE: { label: 'DELETE', class: 'btn-error' },
    };

    function handleOperationClick(operation: APIOperation) {
        selectedOperation = operation;
        // For PUT/DELETE, we might need an ID.
        // This component currently doesn't manage selecting a specific record for PUT/DELETE.
        // That logic would typically be outside this component (e.g., in a table row action).
        // For now, let's assume PUT/DELETE will require an ID to be entered in the modal form.
        recordIdForUpdateOrDelete = null; // Reset
        showModal = true;
    }

    function closeModal() {
        showModal = false;
        selectedOperation = null;
    }

</script>

<div class="flex flex-wrap gap-2 my-2">
    {#each getAllowedOps(resourceType) as operation}
        {@const detail = operationDetails[operation]}
        <button
            class="btn btn-sm {detail.class}"
            onclick={() => handleOperationClick(operation)}
        >
            {detail.label} {resourceName}
        </button>
    {/each}
</div>

{#if showModal && selectedOperation}
    <RLApiOperationModal
        isOpen={showModal}
        onClose={closeModal}
        {schemaName}
        {resourceName}
        operation={selectedOperation}
        {columns}
        initialId={recordIdForUpdateOrDelete}
    />
{/if}