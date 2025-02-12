<!-- src/lib/components/api/OpModal.svelte -->
<script lang="ts">
    import type { APIResource, APIOperation } from '$lib/components/dt/types.js';
    import  { API_OPERATIONS } from '$lib/components/dt/types.js';
    import type { ColumnMetadata } from 'ts-forge';
    import ResourceForm from './ResourceForm.svelte';
    import QueryBuilder from './QueryBuilder.svelte';

    import { forge } from '$lib/forge.svelte.js';

    let { resource, operation, columns, isOpen, onClose } = $props<{
        resource: APIResource;
        operation: APIOperation;
        columns: ColumnMetadata[];
        isOpen: boolean;
        onClose: () => void;
    }>();

    let loading = $state(false);
    let error = $state<string | null>(null);

    async function handleSubmit(data: any) {
        try {
            loading = true;
            error = null;
            
            // Get the CRUD operations for this resource
            const crud = await forge.getTableOperations(
                resource.schema,
                resource.name
            );

            // Handle different operations based on the operation type
            let result;
            switch (operation) {
                case 'GET':
                    // For GET operations, we use findMany with the query data
                    result = await crud.findMany({
                        where: data.filters || {},
                        orderBy: data.orderBy,
                        limit: data.limit,
                        offset: data.offset
                    });
                    break;
                    
                case 'POST':
                    // For POST (create) operations, we use create
                    result = await crud.create(data);
                    break;
                    
                case 'PUT':
                    // For PUT (update) operations, we need both the ID and the update data
                    if (!data.id) {
                        throw new Error('ID is required for update operations');
                    }
                    result = await crud.update(data.id, data);
                    break;
                    
                case 'DELETE':
                    // For DELETE operations, we just need the ID
                    if (!data.id) {
                        throw new Error('ID is required for delete operations');
                    }
                    result = await crud.delete(data.id);
                    break;
                    
                default:
                    throw new Error(`Unsupported operation: ${operation}`);
            }

            // If we got here, the operation was successful
            console.log(`${operation} operation successful:`, result);
            onClose();
            
        } catch (err) {
            // Handle any errors that occurred during the operation
            console.error(`${operation} operation failed:`, err);
            error = (err as Error).message;
        } finally {
            loading = false;
        }
    }

</script>

{#if isOpen}
<div class="modal modal-open">
    <div class="modal-box">
        <h3 class="font-bold text-lg">
            {operation} {resource.name.toUpperCase()}
        </h3>
        
        {#if error}
            <div class="alert alert-error mt-4">{error}</div>
        {/if}

        {#if operation === 'GET'}
            <QueryBuilder {columns} onSubmit={handleSubmit} />
        {:else}
            <ResourceForm 
                {operation}
                {columns}
                onSubmit={handleSubmit}
                {loading}
            />
        {/if}

        <div class="modal-action">
            <button class="btn" onclick={onClose}>Close</button>
        </div>
    </div>
</div>
{/if}