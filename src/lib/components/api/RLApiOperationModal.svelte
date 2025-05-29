<!-- src/lib/components/api/RLApiOperationModal.svelte -->
<script lang="ts">
    import type { ColumnMetadata } from '@yrrrrrf/prism-ts';
    import type { CrudOperations } from '@yrrrrrf/prism-ts'; // Import CrudOperations
    import { apiStore } from '$lib/components/stores/api.svelte';
    import RLFilterForm from '$lib/components/form/RLFilterForm.svelte';
    import RLResourceForm from '$lib/components/form/RLResourceForm.svelte';

    type APIOperation = 'GET' | 'POST' | 'PUT' | 'DELETE';

    let {
        isOpen,
        onClose,
        schemaName,
        resourceName,
        operation,
        columns,
        resourceType,
        initialId = null, // Optional: for pre-filling ID for PUT/DELETE
        initialDataForPut = {} // Optional: for pre-filling form data for PUT
    } = $props<{
        isOpen: boolean;
        onClose: () => void;
        schemaName: string;
        resourceName: string;
        operation: APIOperation;
        columns: ColumnMetadata[];
        resourceType: 'table' | 'view' | 'function';
        initialId?: string | number | null;
        initialDataForPut?: Record<string, any>;
    }>();

    let loading = $state(false);
    let error = $state<string | null>(null);
    let apiResponse = $state<any>(null);
    let crudOps = $state<CrudOperations<any> | null>(null);

    // For PUT/DELETE, we need an ID field if not provided via initialId
    let recordIdForAction = $state<string | number | undefined>(initialId ?? undefined);

    // For PUT, merge initialDataForPut with what might be entered for PKs
    let combinedInitialDataForPut = $derived({
        ...initialDataForPut,
        ...(recordIdForAction && columns.find((c: ColumnMetadata) => c.isPrimaryKey) ? { [columns.find((c: ColumnMetadata) => c.isPrimaryKey)!.name]: recordIdForAction } : {})
    });


    $effect(() => {
        async function initCrud() {
            if (apiStore.IS_CONNECTED && apiStore.prism && schemaName && resourceName) {
                crudOps = await apiStore.prism.getTableOperations(schemaName, resourceName);
            } else {
                crudOps = null;
            }
        }
        if (isOpen) { // Initialize CRUD ops when modal opens
            initCrud();
            recordIdForAction = initialId ?? undefined; // Reset ID when modal reopens
            apiResponse = null; // Clear previous response
            error = null; // Clear previous error
        }
    });

    async function handleFormSubmit(data: any) {
        if (!crudOps) {
            error = "API client not ready.";
            return;
        }
        loading = true; error = null; apiResponse = null;
        try {
            let result;
            switch (operation) {
                case 'GET':
                    result = await crudOps.findMany(data); // `data` here is { where, limit, etc. }
                    break;
                case 'POST':
                    result = await crudOps.create(data); // `data` is the form payload
                    break;
                case 'PUT':
                    const pkColumnPut = columns.find((c: ColumnMetadata) => c.isPrimaryKey);
                    const idToUpdate = recordIdForAction ?? data[pkColumnPut?.name || 'id']; // Get ID from state or form data
                    if (!idToUpdate) throw new Error("Primary key value is required for PUT operation.");
                    
                    const payloadPut = { ...data };
                    if (pkColumnPut) delete payloadPut[pkColumnPut.name]; // Don't send PK in payload if it's part of URL/params

                    result = await crudOps.update(idToUpdate, payloadPut);
                    break;
                case 'DELETE':
                    const pkColumnDelete = columns.find((c: ColumnMetadata) => c.isPrimaryKey);
                     // For DELETE, 'data' from RLResourceForm might contain the PK if we design it that way
                    const idToDelete = recordIdForAction ?? data[pkColumnDelete?.name || 'id'];
                    if (!idToDelete) throw new Error("Primary key value is required for DELETE operation.");
                    
                    await crudOps.delete(idToDelete);
                    result = { message: `Record ${idToDelete} deleted successfully from ${resourceName}.` };
                    break;
            }
            apiResponse = result;
            // Consider calling onClose() automatically on success for POST/PUT/DELETE after a delay
            // For GET, user likely wants to see the response.
            if (operation !== 'GET') {
                setTimeout(() => onClose(), 1500); // Close after 1.5s on success
            }
        } catch (e) {
            console.error("API Operation Error:", e);
            error = e instanceof Error ? e.message : String(e);
        } finally {
            loading = false;
        }
    }

    // Find the primary key column name (simplistic, assumes single PK)
    let primaryKeyName = $derived(columns.find((c: ColumnMetadata) => c.isPrimaryKey)?.name || 'id');

</script>

{#if isOpen}
    <dialog class="modal modal-open" open>
        <div class="modal-box w-11/12 max-w-2xl">
            <form method="dialog">
                <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onclick={onClose}>✕</button>
            </form>
            <h3 class="font-bold text-lg mb-4">
                {operation}
                <span class="badge badge-neutral badge-sm font-mono align-middle">{resourceType}</span>
                <span class="font-mono badge badge-neutral align-middle">{schemaName}.{resourceName}</span>
            </h3>

            {#if error}
                <div role="alert" class="alert alert-error mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Error: {error}</span>
                </div>
            {/if}

            {#if operation === 'GET'}
                <RLFilterForm {columns} onSubmit={handleFormSubmit} {loading} />
            {:else if operation === 'POST'}
                <RLResourceForm {columns} {operation} onSubmit={handleFormSubmit} {loading} />
            {:else if operation === 'PUT'}
                 {#if !initialId} <!-- Only show ID input if not passed as prop (i.e., not from a row action) -->
                    <div class="form-control mb-4">
                        <label class="label" for="put-record-id"><span class="label-text">Record {primaryKeyName} to Update <span class="text-error">*</span></span></label>
                        <input type="text" id="put-record-id" class="input input-bordered" bind:value={recordIdForAction} placeholder="Enter {primaryKeyName}" />
                    </div>
                 {/if}
                <RLResourceForm {columns} {operation} onSubmit={handleFormSubmit} {loading} initialData={combinedInitialDataForPut} />
            {:else if operation === 'DELETE'}
                {#if !initialId}
                    <div class="form-control mb-4">
                         <label class="label" for="delete-record-id"><span class="label-text">Record {primaryKeyName} to Delete <span class="text-error">*</span></span></label>
                        <input type="text" id="delete-record-id" class="input input-bordered" bind:value={recordIdForAction} placeholder="Enter {primaryKeyName}" />
                    </div>
                {/if}
                 <p class="my-4">Are you sure you want to delete record with {primaryKeyName}: <strong class="font-mono">{recordIdForAction || ' (Enter ID above)'}</strong>?</p>
                 <div class="modal-action">
                     <button class="btn" onclick={onClose}>Cancel</button>
                     <button class="btn btn-error" onclick={() => handleFormSubmit({ [primaryKeyName]: recordIdForAction })} disabled={loading || !recordIdForAction}>
                        {#if loading} <span class="loading loading-spinner loading-xs"></span> {/if}
                        Confirm Delete
                    </button>
                 </div>
            {/if}

            {#if apiResponse && operation === 'GET'}
                <div class="mt-6">
                    <h4 class="font-semibold">API Response:</h4>
                    <div class="mockup-code text-xs max-h-96 overflow-auto">
                        <pre data-prefix=">"><code>{JSON.stringify(apiResponse, null, 2)}</code></pre>
                    </div>
                </div>
            {:else if apiResponse && operation !== 'GET'}
                 <div role="alert" class="alert alert-success mt-4">
                     <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{apiResponse.message || 'Operation successful!'}</span>
                </div>
            {/if}

            {#if operation !== 'DELETE'} <!-- Delete has its own actions -->
            <div class="modal-action mt-4">
                <button class="btn" onclick={onClose}>Close</button>
            </div>
            {/if}
        </div>
         <form method="dialog" class="modal-backdrop">
            <button onclick={onClose}>close</button>
        </form>
    </dialog>
{/if}