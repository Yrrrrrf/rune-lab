<!-- src/lib/components/explorer/RLSchemaExplorer.svelte -->
<script lang="ts">
    import type {
        SchemaMetadata as PrismSchemaMetadata, // Original type from prism-ts
        // Other prism-ts types might be needed if used directly for options in openModalForApi
        ColumnMetadata as PrismColumnMetadata,
        FunctionParameter as PrismFunctionParameter,
    } from '@yrrrrrf/prism-ts';
    import { apiStore } from '$lib/components/stores/api.svelte';
    import { explorerStore, type ExplorerEntityType as StoreExplorerEntityType } from '$lib/components/stores/explorer.svelte';
    import RLMetadataTable from '$lib/components/dataview/RLMetadataTable.svelte';
    import RLApiInterface from '$lib/components/api/RLApiInterface.svelte';
    import RLApiOperationModal from '$lib/components/api/RLApiOperationModal.svelte';

    // Import Rune Lab specific types and the transformer
    import type { RLSchemaData, RLTableMetadata, RLViewMetadata, RLEnumMetadata, RLFunctionMetadata, RLColumnMetadata, RLColumnReference } from '$lib/components/stores/explorer.svelte';
    import { transformPrismSchemasToRLData } from '$lib/tools/schema-transformer.js'; // Correct path to tools index

    type APIOperation = 'GET' | 'POST' | 'PUT' | 'DELETE';
    type ModalResourceType = 'table' | 'view' | 'function';

    let schemas = $state<RLSchemaData[] | null>(null); // Use RLSchemaData here
    let isLoading = $state(true);
    let error = $state<string | null>(null);

    // Modal state for API Operations
    let isModalOpen = $state(false);
    let modalTargetSchemaName = $state<string>('');
    let modalTargetResourceName = $state<string>('');
    let modalTargetResourceType = $state<ModalResourceType>('table');
    let modalTargetColumns = $state<RLColumnMetadata[]>([]); // Use RLColumnMetadata
    let modalTargetOperation = $state<APIOperation>('GET');
    // For function parameters, the RLApiOperationModal might expect PrismFunctionParameter directly from prism-ts,
    // or we transform them before passing. Let's assume it takes PrismFunctionParameter for now or RLFunctionParameter.
    // The RLFunctionMetadata in RLSchemaData contains RLFunctionParameter.
    let modalTargetFunctionParams = $state<PrismFunctionParameter[] | null>(null); // Or RLFunctionParameter[]
    let modalInitialId = $state<string | number | null>(null);
    let modalInitialDataForPut = $state<Record<string, any>>({});

    // Modal state for Enum Details
    let showEnumModal = $state(false);
    let currentEnumDetails = $state<{ name: string; values: string[]; schema: string } | null>(null);


    function computeCurrentSelectedSchema(): RLSchemaData | null { // Use RLSchemaData
        const activeName = explorerStore.activeSchemaName;
        const currentSchemas = schemas;
        if (!activeName || !currentSchemas) {
            return null;
        }
        return currentSchemas.find(s => s.name === activeName) || null;
    }
    let currentSelectedSchemaObject = $derived(computeCurrentSelectedSchema());

    function computeCurrentEntityItems(): Record<string, any> | null {
        const schemaObj = currentSelectedSchemaObject;
        const activeType = explorerStore.activeEntityType;

        // Ensure explorerStore.activeEntityType is a valid key for RLSchemaData
        if (schemaObj && activeType && schemaObj[activeType as keyof RLSchemaData]) {
            const entities = schemaObj[activeType as keyof RLSchemaData]; // Type assertion
             // Check if entities is not undefined and is an object
            if (entities && typeof entities === 'object' && !Array.isArray(entities)) {
                 return (Object.keys(entities).length > 0) ? entities as Record<string, any> : null;
            }
        }
        return null;
    }
    let currentEntityItems = $derived(computeCurrentEntityItems());


    $effect(() => {
        // ... (scroll effect remains the same, uses derived values) ...
        const schemaObj = currentSelectedSchemaObject;
        const focusedName = explorerStore.focusedEntityName;
        const activeType = explorerStore.activeEntityType;

        if (focusedName && schemaObj && activeType) {
            const elementId = `entity-${schemaObj.name}-${activeType}-${focusedName}`;
            const element = document.getElementById(elementId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const inputElement = element.querySelector('input[type="checkbox"]') as HTMLInputElement;
                if (inputElement && !inputElement.checked) {
                    inputElement.checked = true;
                }
            }
        }
    });

    $effect(() => {
        async function loadAndTransformSchemas() {
            if (!apiStore.IS_CONNECTED || !apiStore.prism) {
                isLoading = !apiStore.IS_CONNECTED;
                error = apiStore.IS_CONNECTED ? null : "API not connected. Waiting for connection...";
                schemas = null;
                return;
            }
            try {
                isLoading = true;
                error = null;
                // Fetch raw schemas using prism-ts types
                const rawFetchedSchemasFromPrism = await apiStore.prism.getSchemas() as PrismSchemaMetadata[];

                // Use the new transformer
                const transformedSchemasResult = transformPrismSchemasToRLData(rawFetchedSchemasFromPrism);
                
                schemas = transformedSchemasResult;

                if (transformedSchemasResult.length > 0 && !explorerStore.activeSchemaName) {
                    explorerStore.selectSchema(transformedSchemasResult[0].name);
                } else if (explorerStore.activeSchemaName && !transformedSchemasResult.find(s => s.name === explorerStore.activeSchemaName)) {
                    explorerStore.selectSchema(transformedSchemasResult.length > 0 ? transformedSchemasResult[0].name : null);
                }

            } catch (e) {
                console.error("[RLSchemaExplorer] Error in loadAndTransformSchemas:", e);
                error = e instanceof Error ? e.message : 'An unknown error occurred processing schema data.';
                schemas = null;
            } finally {
                isLoading = false;
            }
        }
        loadAndTransformSchemas();
    });

    function getEntityCount(schema: RLSchemaData | null, entityType: StoreExplorerEntityType): number {
        if (!schema || !schema[entityType as keyof RLSchemaData]) return 0;
        const entities = schema[entityType as keyof RLSchemaData];
        return (entities && typeof entities === 'object' && !Array.isArray(entities)) ? Object.keys(entities).length : 0;
    }
    
    // This function should now expect RLTableMetadata or RLViewMetadata and return RLColumnMetadata[]
    function getColumnsForTableOrView(item: RLTableMetadata | RLViewMetadata): RLColumnMetadata[] {
        return item.columns || [];
    }
    
    function openModalForApi(
        params: { operation: APIOperation },
        currentSchemaFromCall: string,
        currentResourceName: string,
        currentModalResourceType: ModalResourceType,
        options: {
            // Expect RLColumnMetadata for consistency if RLApiOperationModal is adapted
            columns?: RLColumnMetadata[]; 
            // For function parameters, `itemData as RLFunctionMetadata` will have `parameters` of type RLFunctionParameter[]
            // The RLApiOperationModal props expect PrismFunctionParameter[] (or null).
            // We need to either adapt RLApiOperationModal or transform back if strictly necessary.
            // For simplicity, let's assume RLApiOperationModal can be adapted or we can transform `RLFunctionParameter[]`
            // back to `PrismFunctionParameter[]` if RLApiOperationModal MUST take the prism-ts type.
            // If RLApiOperationModal is changed to use RLFunctionParameter, then no conversion needed.
            // If it stays with PrismFunctionParameter, then:
            // functionParams?: PrismFunctionParameter[] | null;
            // And when calling:
            // functionParams: (itemData as RLFunctionMetadata).parameters.map(transformRLParamToPrismParam)
            // Let's keep modalTargetFunctionParams as PrismFunctionParameter for now as it was
            functionParams?: PrismFunctionParameter[] | null; // Sticking to what modal currently expects from props
            initialId?: string | number | null;
            initialDataForPut?: Record<string, any>;
        } = {}
    ): void {
        modalTargetOperation = params.operation;
        modalTargetSchemaName = currentSchemaFromCall;
        modalTargetResourceName = currentResourceName;
        modalTargetResourceType = currentModalResourceType;
        modalTargetColumns = options.columns || [];
        modalTargetFunctionParams = options.functionParams || null;
        modalInitialId = options.initialId || null;
        modalInitialDataForPut = options.initialDataForPut || {};
        isModalOpen = true;
    }

    function closeModal() {
        isModalOpen = false;
        // ... (reset modal state properties) ...
    }

    function handleFkReferenceClicked(ref: RLColumnReference) { // Expects RLColumnReference
        explorerStore.navigateToEntity(ref.schema, 'tables', ref.table);
    }

    // RLEnumMetadata provides name, values, schema directly
    function handleEnumBadgeClicked(enumData: RLEnumMetadata) {
        currentEnumDetails = { name: enumData.name, values: enumData.values, schema: enumData.schema };
        showEnumModal = true;
    }
</script>

<!-- Template for src/lib/components/explorer/RLSchemaExplorer.svelte -->
<!-- ... (Template remains largely the same, but ensure data bindings use RL... types) ... -->
<!-- Example changes in template: -->
<!-- For RLMetadataTable:
    columns={getColumnsForTableOrView(typedItem as (RLTableMetadata | RLViewMetadata))}
    enumsInSchema={activeSchema.enums as Record<string, RLEnumMetadata>} // Cast might be needed
    onEnumClick={(enumData) => handleEnumBadgeClicked(enumData)} // This will now pass RLEnumMetadata
-->
<!-- For RLApiInterface call:
    columns={getColumnsForTableOrView(typedItem as (RLTableMetadata | RLViewMetadata))}
    onOpenModal={(opParams) => openModalForApi(
        opParams,
        activeSchema.name,
        name,
        explorerStore.activeEntityType === 'tables' ? 'table' : 'view',
        // Pass RLColumnMetadata
        { columns: getColumnsForTableOrView(typedItem as (RLTableMetadata | RLViewMetadata)) } 
    )}
-->
<!-- For Function/Procedure RLApiInterface call:
    onOpenModal={(opParams) => {
        const funcMeta = typedItem as RLFunctionMetadata;
        // IMPORTANT: Here's where a decision for functionParams is needed.
        // If RLApiOperationModal expects PrismFunctionParameter[]:
        // You would need a function `transformRLParamToPrismParam` or map directly here.
        // For now, assuming RLFunctionMetadata.parameters IS what RLApiOperationModal's functionParams prop wants (which is PrismFunctionParameter[]).
        // This implies that our RLFunctionParameter and PrismFunctionParameter are structurally compatible or RLApiOperationModal is adapted.
        // If RLFunctionParameter IS different from PrismFunctionParameter in a way that matters to the modal:
        // const prismParams: PrismFunctionParameter[] = funcMeta.parameters.map(rlParam => ({...rlParam, defaultValue: rlParam.defaultValue ?? undefined }));
        // The current RLFunctionParameter in types/explorer.ts matches PrismFunctionParameter structure sufficiently for the RLApiOperationModal to consume if `functionParams` prop remains PrismFunctionParameter[]
        
        openModalForApi(
            opParams,
            activeSchema.name,
            name,
            'function',
            // Assuming RLApiOperationModal expects PrismFunctionParameter[] and our RLFunctionParameter[] from typedItem is compatible.
            // If types diverge significantly, a mapping function would be needed here.
            // The `modalTargetFunctionParams = $state<PrismFunctionParameter[] | null>(null);` means we have to ensure the structure is compatible or map it.
            // Our RLFunctionParameter looks very similar to PrismFunctionParameter in the example `RLApiOperationModal`.
            { functionParams: (typedItem as RLFunctionMetadata).parameters as unknown as PrismFunctionParameter[] } // Cast if shapes are compatible
        );
    }}
-->
<!-- In the #each Object.entries(currentEntityItems) -->
<!-- Change itemData casts: -->
<!-- {@const typedItem = itemData as (RLTableMetadata | RLViewMetadata)} -->
<!-- {@const typedItem = itemData as RLEnumMetadata} -->
<!-- {@const typedItem = itemData as RLFunctionMetadata} -->

<!-- RLApiOperationModal call needs to match prop types. If RLApiOperationModal's `columns` prop changes to RLColumnMetadata[], then no cast is needed.
    Otherwise, `modalTargetColumns as unknown as PrismColumnMetadata[]` might be needed.
    Similar for `functionParams`. -->
<div class="container mx-auto p-4">
    {#if isLoading}
        <div class="flex flex-col items-center justify-center h-64">
            <span class="loading loading-spinner loading-lg text-primary"></span>
            <p class="mt-4 text-neutral-content/80">{error || 'Loading schemas...'}</p>
        </div>
    {:else if error && !isLoading}
        <div role="alert" class="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
                <h3 class="font-bold">Error Loading/Preparing Schemas!</h3>
                <div class="text-xs">{error}</div>
            </div>
        </div>
    {:else if schemas && schemas.length > 0}
        <div role="tablist" class="tabs tabs-lifted tabs-lg mb-6">
             {#each schemas as schema (schema.name)}
                <button
                    role="tab"
                    class="tab {explorerStore.activeSchemaName === schema.name ? 'tab-active font-semibold' : ''}"
                    onclick={() => explorerStore.selectSchema(schema.name)}
                    aria-selected={explorerStore.activeSchemaName === schema.name}
                >
                    {schema.name}
                </button>
            {/each}
        </div>

        {#if currentSelectedSchemaObject}
            {@const activeSchema = currentSelectedSchemaObject}
            {#if explorerStore.breadcrumbs.length > 1}
                 <div class="mb-3">
                    <button class="btn btn-xs btn-ghost" onclick={() => explorerStore.goBack()}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8l8 8l1.41-1.41L7.83 13H20z"/></svg>
                        Back
                    </button>
                </div>
            {/if}
            
            <div class="bg-base-200 p-4 rounded-box">
                <div role="tablist" class="tabs tabs-bordered mb-6">
                    {#each (['tables', 'views', 'enums', 'functions', 'procedures', 'triggers'] as const) satisfies StoreExplorerEntityType[] as entityTypeLoop}
                        {@const count = getEntityCount(activeSchema, entityTypeLoop)}
                        <button
                            role="tab"
                            class="tab {explorerStore.activeEntityType === entityTypeLoop ? 'tab-active' : ''} [--tab-bg:oklch(var(--b2))] [--tab-border-color:oklch(var(--b3))]"
                            onclick={() => explorerStore.selectEntityType(entityTypeLoop)}
                            aria-selected={explorerStore.activeEntityType === entityTypeLoop}
                            disabled={count === 0 && explorerStore.activeEntityType !== entityTypeLoop}
                        >
                            {entityTypeLoop.charAt(0).toUpperCase() + entityTypeLoop.slice(1)}
                            <span class="badge badge-sm badge-ghost ml-2">{count}</span>
                        </button>
                    {/each}
                </div>

                <div class="space-y-6">
                    {#if currentEntityItems && Object.keys(currentEntityItems).length > 0}
                        {#each Object.entries(currentEntityItems) as [name, itemData] (activeSchema.name + explorerStore.activeEntityType + name)}
                            {@const entityId = `entity-${activeSchema.name}-${explorerStore.activeEntityType}-${name}`}
                            <!-- Display for Tables and Views -->
                            {#if explorerStore.activeEntityType === 'tables' || explorerStore.activeEntityType === 'views'}
                                {@const typedItem = itemData as (RLTableMetadata | RLViewMetadata)}
                                <div class="collapse collapse-arrow bg-base-100 shadow-md {explorerStore.focusedEntityName === name ? 'collapse-open ring-1 ring-primary ring-offset-base-100 ring-offset-2' : ''}" id={entityId}>
                                    <input 
                                        type="checkbox" 
                                        name="item-accordion-{activeSchema.name}-{explorerStore.activeEntityType}-{name}" 
                                        checked={explorerStore.focusedEntityName === name} 
                                        onchange={(e) => {
                                            if(e.currentTarget.checked) explorerStore.focusOnEntity(name);
                                            else if(explorerStore.focusedEntityName === name) explorerStore.focusOnEntity(null);
                                        }}
                                    />
                                    <div 
                                        class="collapse-title text-xl font-medium" 
                                        role="button"
                                        tabindex="0"
                                        onclick={() => explorerStore.focusOnEntity(explorerStore.focusedEntityName === name ? null : name)}
                                        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); explorerStore.focusOnEntity(explorerStore.focusedEntityName === name ? null : name);}}}
                                    >
                                        {name}
                                        <span class="badge badge-ghost ml-2 capitalize">{explorerStore.activeEntityType === 'tables' ? 'Table' : 'View'}</span>
                                    </div>
                                    <div class="collapse-content">
                                        <RLMetadataTable
                                            title={name}
                                            itemType={explorerStore.activeEntityType === 'tables' ? 'table' : 'view'}
                                            columns={getColumnsForTableOrView(typedItem)}
                                            enumsInSchema={activeSchema.enums as Record<string, RLEnumMetadata>}
                                            onFkClick={handleFkReferenceClicked}
                                            onEnumClick={(enumDataFromTable) => {
                                                // RLMetadataTable will pass the RLEnumMetadata for the clicked enum
                                                // (or details if `onEnumClick` prop in RLMetadataTable is updated to send just `name`, `values`)
                                                // Assuming it passes the full RLEnumMetadata or an object with {name, values} and schema is added here
                                                const foundEnum = activeSchema.enums[enumDataFromTable.name]; // Or how enumDataFromTable is structured
                                                if(foundEnum) handleEnumBadgeClicked(foundEnum);
                                            }}
                                        />
                                        <div class="mt-4 p-2 border-t border-base-300">
                                            <RLApiInterface
                                                schemaName={activeSchema.name}
                                                resourceName={name}
                                                resourceType={explorerStore.activeEntityType === 'tables' ? 'table' : 'view'}
                                                columns={getColumnsForTableOrView(typedItem)}
                                                onOpenModal={(opParams) => openModalForApi(
                                                    opParams,
                                                    activeSchema.name,
                                                    name,
                                                    explorerStore.activeEntityType === 'tables' ? 'table' : 'view',
                                                    { columns: getColumnsForTableOrView(typedItem) }
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            <!-- Display for Enums -->
                            {:else if explorerStore.activeEntityType === 'enums'}
                                {@const typedItem = itemData as RLEnumMetadata}
                                <div class="collapse collapse-arrow bg-base-100 shadow-md" id={entityId}>
                                    <input type="checkbox" name="item-accordion-{activeSchema.name}-enum-{name}" />
                                    <div 
                                        class="collapse-title text-xl font-medium"
                                        role="button"
                                        tabindex="0"
                                        onclick={(e) => { const input = e.currentTarget.previousElementSibling as HTMLInputElement; if(input) input.checked = !input.checked;}}
                                        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const input = e.currentTarget.previousElementSibling as HTMLInputElement; if(input) input.checked = !input.checked;}}}
                                    >
                                        {name} <span class="badge badge-ghost ml-2">Enum</span>
                                    </div>
                                    <div class="collapse-content">
                                        <p class="font-semibold">Values:</p>
                                        <ul class="list-disc list-inside pl-4 font-mono text-xs">
                                            {#each typedItem.values as value}
                                                <li>{value}</li>
                                            {/each}
                                        </ul>
                                        <button class="btn btn-xs btn-outline mt-2" onclick={() => handleEnumBadgeClicked(typedItem)}>
                                            Show Details
                                        </button>
                                    </div>
                                </div>
                            <!-- Display for Functions, Procedures, Triggers (now consolidated under RLFunctionMetadata) -->
                            {:else if explorerStore.activeEntityType === 'functions' || explorerStore.activeEntityType === 'procedures' || explorerStore.activeEntityType === 'triggers'}
                                {@const typedItem = itemData as RLFunctionMetadata}
                                <div class="collapse collapse-arrow bg-base-100 shadow-md" id={entityId}>
                                    <input type="checkbox" name="item-accordion-{activeSchema.name}-{explorerStore.activeEntityType}-{name}" />
                                    <div 
                                        class="collapse-title text-xl font-medium"
                                        role="button"
                                        tabindex="0"
                                        onclick={(e) => { const input = e.currentTarget.previousElementSibling as HTMLInputElement; if(input) input.checked = !input.checked;}}
                                        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const input = e.currentTarget.previousElementSibling as HTMLInputElement; if(input) input.checked = !input.checked;}}}
                                    >
                                        <!-- Display 'kind' which now includes PROCEDURE, TRIGGER etc. -->
                                        {name} <span class="badge badge-ghost ml-2 capitalize">{typedItem.kind.toLowerCase()}</span>
                                    </div>
                                    <div class="collapse-content">
                                        {#if typedItem.description}
                                            <p class="mb-2 text-sm opacity-80"><strong>Description:</strong> {typedItem.description}</p>
                                        {/if}
                                        <p class="mb-1"><strong>Return Type:</strong> <span class="font-mono text-xs badge badge-outline">{typedItem.returnType || 'void'}</span></p>
                                        {#if typedItem.parameters && typedItem.parameters.length > 0}
                                            <p class="font-semibold mt-3 mb-1">Parameters:</p>
                                            <div class="overflow-x-auto">
                                                <table class="table table-sm table-zebra w-full text-xs">
                                                    <thead><tr><th>Name</th><th>Type</th><th>Mode</th><th>Default?</th></tr></thead>
                                                    <tbody>
                                                        {#each typedItem.parameters as param (param.name)}
                                                        <tr>
                                                            <td class="font-medium">{param.name}</td>
                                                            <td class="font-mono">{param.type}</td>
                                                            <td><span class="badge badge-xs badge-info">{param.mode}</span></td>
                                                            <td>{param.hasDefault ? '✓' : '✗'}</td>
                                                        </tr>
                                                        {/each}
                                                    </tbody>
                                                </table>
                                            </div>
                                        {:else}
                                         <p class="text-sm opacity-70 mt-2">No parameters.</p>
                                        {/if}

                                        {#if typedItem.kind === 'FUNCTION' || typedItem.kind === 'PROCEDURE'}
                                            <div class="mt-4 p-2 border-t border-base-300">
                                                <RLApiInterface
                                                    schemaName={activeSchema.name}
                                                    resourceName={name}
                                                    resourceType={'function'}
                                                    columns={[]}
                                                    onOpenModal={(opParams) => openModalForApi(
                                                        opParams,
                                                        activeSchema.name,
                                                        name,
                                                        'function',
                                                        // typedItem.parameters are RLFunctionParameter[]. RLApiOperationModal expects PrismFunctionParameter[]
                                                        // Assuming direct castability for now due to similar structure
                                                        { functionParams: typedItem.parameters as unknown as PrismFunctionParameter[] }
                                                    )}
                                                />
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            {/if}
                        {/each}
                    {:else}
                        <div class="text-center p-6 bg-base-100 rounded-md shadow">
                            <p class="text-lg text-neutral-content/70">No {explorerStore.activeEntityType} found in schema <span class="font-semibold text-primary">{activeSchema.name}</span>.</p>
                            <p class="text-sm text-neutral-content/50">Ensure the API is providing data for this entity type or select another type.</p>
                        </div>
                    {/if}
                </div>
            </div>
        {:else if !isLoading}
            <div role="alert" class="alert alert-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>Please select a schema to explore its contents.</span>
            </div>
        {/if}
    {:else if !isLoading && (!schemas || schemas.length === 0)}
         <div role="alert" class="alert">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-info shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>No schemas found. Check API configuration and connection.</span>
        </div>
    {/if}

    {#if isModalOpen && modalTargetSchemaName && modalTargetResourceName}
        <RLApiOperationModal
            isOpen={isModalOpen}
            onClose={closeModal}
            schemaName={modalTargetSchemaName}
            resourceName={modalTargetResourceName}
            operation={modalTargetOperation}    
            columns={modalTargetColumns as unknown as PrismColumnMetadata[]}
            functionParams={modalTargetFunctionParams}
            resourceType={modalTargetResourceType}
            initialId={modalInitialId}
            initialDataForPut={modalInitialDataForPut}
        />
    {/if}

    {#if showEnumModal && currentEnumDetails}
        <dialog class="modal modal-open" open>
            <div class="modal-box">
                <form method="dialog">
                    <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onclick={() => showEnumModal = false}>✕</button>
                </form>
                <h3 class="font-bold text-lg">Enum: <span class="font-mono badge badge-outline">{currentEnumDetails.name}</span></h3>
                <p class="py-1"><span class="font-semibold">Schema:</span> <span class="font-mono badge badge-ghost">{currentEnumDetails.schema}</span></p>
                <p class="font-semibold mt-3 mb-1">Values:</p>
                <div class="max-h-60 overflow-y-auto bg-base-200 p-3 rounded-md">
                    <ul class="list-disc list-inside pl-2 space-y-1">
                        {#each currentEnumDetails.values as value}
                            <li class="font-mono text-sm">{value}</li>
                        {/each}
                    </ul>
                </div>
                <div class="modal-action mt-4">
                    <button class="btn" onclick={() => showEnumModal = false}>Close</button>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop"><button onclick={() => showEnumModal = false}>close</button></form>
        </dialog>
    {/if}
</div>