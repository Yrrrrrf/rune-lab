<!-- src/lib/components/api/APIInterface.svelte -->
<script lang="ts">
    import type { ColumnMetadata } from 'ts-forge';
    import type { APIResource, APIOperation } from '$lib/components/dt/types.js';

    import { getAllowedOperations } from '$lib/components/dt/types.js';
    import OpModal from './OpModal.svelte';

    let { resource, columns } = $props<{
        resource: APIResource;
        columns: ColumnMetadata[];
    }>();

    let showModal = $state(false);
    let selectedOperation: APIOperation = $state('GET');

    function handleOperationClick(operation: APIOperation) {
        selectedOperation = operation;
        showModal = true;
    }
</script>

<div class="space-y-4">
    <div class="flex gap-2">
        {#each getAllowedOperations(resource.type) as operation}
        <button
            class="px-4 py-2 text-white rounded-md"
            onclick={() => handleOperationClick(operation)}
        >
            <div class="flex items-center gap-2">
                {operation}
            </div>
        </button>
    
        {/each}
    </div>

    {#if showModal}
        <OpModal
            {resource}
            operation={selectedOperation}
            {columns}
            isOpen={showModal}
            onClose={() => showModal = false}
        />
    {/if}
</div>