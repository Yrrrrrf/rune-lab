<!-- src/lib/components/api/APIInterface.svelte -->
<script lang="ts">
    import type { ColumnMetadata } from 'ts-forge';
    import type { APIResource, APIOperation } from '$lib/components/dt/types.js';

    import { getAllowedOperations } from '$lib/components/dt/types.js';
    import OpButton from './OpButton.svelte';
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
            <OpButton 
                op={operation}
                onClick={() => handleOperationClick(operation)}
            />
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