<!-- src/lib/components/api/RLApiOperationModal.svelte -->
<script lang="ts">
    // Import Prism types if columns are directly from prism-ts
    import type {
        ColumnMetadata as PrismColumnMetadata, // Using Prism's type for columns
        FunctionParameter as PrismFunctionParameter, // Using Prism's type for functionParams
        CrudOperations
    } from '@yrrrrrf/prism-ts';
    import { apiStore } from '$lib/components/stores/api.svelte';
    import RLResourceForm from '$lib/components/form/RLResourceForm.svelte';
    import RLFilterForm from '$lib/components/form/RLFilterForm.svelte';
    import RLFunctionForm from '$lib/components/form/RLFunctionForm.svelte';
    import type { RLEnumMetadata } from '$lib/components/stores/explorer.svelte'; // For enumsInSchema prop

    type APIOperation = 'GET' | 'POST' | 'PUT' | 'DELETE';
    type ModalResourceType = 'table' | 'view' | 'function';

    let {
        isOpen,
        onClose,
        schemaName,
        resourceName, // This is the currentResourceName for RLFilterForm
        operation,
        columns = [], // Default to empty array; expecting PrismColumnMetadata[]
        functionParams = null, // Expecting PrismFunctionParameter[]
        resourceType,
        initialId = null,
        initialDataForPut = {},
        enumsInSchema = {} // Propagated from RLSchemaExplorer
    } = $props<{
        isOpen: boolean;
        onClose: () => void;
        schemaName: string;
        resourceName: string; // Name of the table, view, or function
        operation: APIOperation;
        columns?: PrismColumnMetadata[]; // Explicitly PrismColumnMetadata
        functionParams?: PrismFunctionParameter[] | null; // Explicitly PrismFunctionParameter
        resourceType: ModalResourceType;
        initialId?: string | number | null;
        initialDataForPut?: Record<string, any>;
        enumsInSchema?: Record<string, RLEnumMetadata>;
    }>();

    let loading = $state(false);
    let error = $state<string | null>(null);
    let apiResponse = $state<any>(null);
    let crudOps = $state<CrudOperations<any> | null>(null);
    let recordIdForAction = $state<string | number | undefined>(initialId ?? undefined);

    // Corrected: Use `c.is_pk` for PrismColumnMetadata
    let primaryKeyColumn = $derived(columns?.find((c: PrismColumnMetadata) => c.is_pk === true));
    let primaryKeyName = $derived(primaryKeyColumn?.name || 'id');

    let combinedInitialDataForPut = $derived({
        ...initialDataForPut,
        ...(recordIdForAction && primaryKeyColumn ? { [primaryKeyColumn.name]: recordIdForAction } : {})
    });

    $effect(() => {
        async function initClient() {
            if (isOpen && apiStore.IS_CONNECTED && apiStore.prism && schemaName && resourceName) {
                if (resourceType === 'table' || resourceType === 'view') {
                    crudOps = await apiStore.prism.getTableOperations(schemaName, resourceName);
                } else {
                    crudOps = null;
                }
            } else {
                crudOps = null;
            }
            if (isOpen) {
                recordIdForAction = initialId ?? undefined;
                apiResponse = null;
                error = null;
            }
        }
        initClient();
    });

    async function handleFormSubmit(data: any) {
        if (!apiStore.prism) {
            error = "API client (Prism) not ready.";
            return;
        }
        loading = true; error = null; apiResponse = null;
        try {
            let result;
            if (resourceType === 'table' || resourceType === 'view') {
                if (!crudOps) {
                    error = "CRUD operations not initialized.";
                    loading = false; return;
                }
                switch (operation) {
                    case 'GET':
                        result = await crudOps.findMany(data); // findMany used for GET with filters
                        break;
                    case 'POST':
                        result = await crudOps.create(data);
                        break;
                    case 'PUT':
                        // Corrected: Use primaryKeyColumn directly
                        const idToUpdate = recordIdForAction ?? data[primaryKeyName];
                        if (!idToUpdate) throw new Error("Primary key value is required for PUT.");
                        const payloadPut = { ...data };
                        if (primaryKeyColumn) delete payloadPut[primaryKeyColumn.name]; // Remove PK from payload if it exists
                        result = await crudOps.update(idToUpdate, payloadPut);
                        break;
                    case 'DELETE':
                        // Corrected: Use primaryKeyColumn directly
                        const idToDelete = recordIdForAction ?? data[primaryKeyName];
                        if (!idToDelete) throw new Error("Primary key value is required for DELETE.");
                        await crudOps.delete(idToDelete);
                        result = { message: `Record ${idToDelete} deleted successfully.` };
                        break;
                }
            } else if (resourceType === 'function') {
                if (operation === 'POST') {
                    result = await apiStore.prism.executeFunction(schemaName, resourceName, data);
                } else {
                    throw new Error(`Operation ${operation} not supported for functions via this modal.`);
                }
            }
            apiResponse = result;
            if (operation !== 'GET' || resourceType === 'function') { // Close modal on success for non-GET or function exec
                setTimeout(() => onClose(), 1500);
            }
        } catch (e) {
            console.error("API Operation Error:", e);
            error = e instanceof Error ? e.message : String(e);
        } finally {
            loading = false;
        }
    }
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

            {#if resourceType === 'function'}
                {#if operation === 'POST' && functionParams}
                    <RLFunctionForm params={functionParams} onSubmit={handleFormSubmit} {loading} />
                {:else}
                    <p class="text-error">Configuration error: Operation {operation} not set up for functions or parameters missing.</p>
                {/if}
            {:else if operation === 'GET'}
                <RLFilterForm
                    columns={columns}
                    onSubmit={handleFormSubmit}
                    {loading}
                    {enumsInSchema}
                    currentResourceName={resourceName}
                />
            {:else if operation === 'POST'}
                <!-- RLResourceForm needs to handle PrismColumnMetadata or columns need transformation -->
                <RLResourceForm
                    columns={columns}
                    {operation}
                    onSubmit={handleFormSubmit}
                    {loading}
                    {enumsInSchema}
                    currentResourceName={resourceName}
                />
            {:else if operation === 'PUT'}
                {#if !initialId && resourceType !== 'function'}
                    <div class="form-control mb-4">
                        <label class="label" for="put-record-id">
                            <span class="label-text">Record {primaryKeyName} to Update <span class="text-error">*</span></span>
                        </label>
                        <input type="text" id="put-record-id" class="input input-bordered" bind:value={recordIdForAction} placeholder="Enter {primaryKeyName}" />
                    </div>
                {/if}
                <RLResourceForm
                    columns={columns}
                    {operation}
                    onSubmit={handleFormSubmit}
                    {loading}
                    initialData={combinedInitialDataForPut}
                    {enumsInSchema}
                    currentResourceName={resourceName}
                />
            {:else if operation === 'DELETE'}
                 {#if !initialId && resourceType !== 'function'}
                    <div class="form-control mb-4">
                        <label class="label" for="delete-record-id">
                            <span class="label-text">Record {primaryKeyName} to Delete <span class="text-error">*</span></span>
                        </label>
                        <input type="text" id="delete-record-id" class="input input-bordered" bind:value={recordIdForAction} placeholder="Enter {primaryKeyName}" />
                    </div>
                {/if}
                <p class="my-4">Are you sure you want to delete record with {primaryKeyName}: <strong class="font-mono">{recordIdForAction || ' (Enter ID above)'}</strong>?</p>
                <div class="modal-action">
                    <button class="btn" onclick={onClose}>Cancel</button>
                    <button class="btn btn-error" onclick={() => handleFormSubmit({ [primaryKeyName]: recordIdForAction })} disabled={loading || !recordIdForAction}>
                       {#if loading} <span class="loading loading-spinner loading-xs"></span> {/if} Confirm Delete
                   </button>
                </div>
            {/if}

            {#if apiResponse}
                <div class="mt-6">
                    <h4 class="font-semibold">API Response:</h4>
                    <div class="mockup-code text-xs max-h-96 overflow-auto">
                        <pre data-prefix=">"><code>{JSON.stringify(apiResponse, null, 2)}</code></pre>
                    </div>
                </div>
            {/if}

            {#if (operation !== 'DELETE' || (resourceType === 'function' && operation === 'POST')) && (operation !== 'GET' || apiResponse)}
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