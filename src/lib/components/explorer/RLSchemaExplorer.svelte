<!-- src/lib/components/explorer/RLSchemaExplorer.svelte -->
// src/lib/components/explorer/RLSchemaExplorer.svelte
<script lang="ts">
    import type {
        SchemaMetadata,
        TableMetadata,
        ViewMetadata,
        EnumMetadata,
        FunctionMetadata,
        ColumnMetadata,
        ColumnReference,
        FunctionParameter,
    } from '@yrrrrrf/prism-ts';
    import { apiStore } from '$lib/components/stores/api.svelte';
    import { explorerStore, type ExplorerEntityType as StoreExplorerEntityType } from '$lib/components/stores/explorer.svelte';
    import RLMetadataTable from '$lib/components/dataview/RLMetadataTable.svelte';
    import RLApiInterface from '$lib/components/api/RLApiInterface.svelte';
    import RLApiOperationModal from '$lib/components/api/RLApiOperationModal.svelte';

    // If EntityType is used in the template, it can be aliased from the store's export
    // type EntityType = StoreExplorerEntityType; 
    // Or if not used in template, no need for this alias here.

    type APIOperation = 'GET' | 'POST' | 'PUT' | 'DELETE';
    type ModalResourceType = 'table' | 'view' | 'function';

    let schemas = $state<SchemaMetadata[] | null>(null);
    let isLoading = $state(true);
    let error = $state<string | null>(null);

    // Modal state for API Operations
    let isModalOpen = $state(false);
    let modalTargetSchemaName = $state<string>('');
    let modalTargetResourceName = $state<string>('');
    let modalTargetResourceType = $state<ModalResourceType>('table');
    let modalTargetColumns = $state<ColumnMetadata[]>([]);
    let modalTargetOperation = $state<APIOperation>('GET');
    let modalTargetFunctionParams = $state<FunctionMetadata['parameters'] | null>(null);
    let modalInitialId = $state<string | number | null>(null);
    let modalInitialDataForPut = $state<Record<string, any>>({});

    // Modal state for Enum Details
    let showEnumModal = $state(false);
    let currentEnumDetails = $state<{ name: string; values: string[]; schema: string } | null>(null);

    // --- Computation function for currentSelectedSchemaObject ---
    function computeCurrentSelectedSchema(): SchemaMetadata | null {
        const activeName = explorerStore.activeSchemaName;
        const currentSchemas = schemas; // Access the $state variable's value
        if (!activeName || !currentSchemas) {
            return null;
        }
        return currentSchemas.find(s => s.name === activeName) || null;
    }
    // Use the computation function with $derived
    let currentSelectedSchemaObject = $derived(computeCurrentSelectedSchema());

    // --- Computation function for currentEntityItems ---
    function computeCurrentEntityItems(): Record<string, any> | null {
        const schemaObj = currentSelectedSchemaObject; // Access the previously derived value
        const activeType = explorerStore.activeEntityType;
        if (schemaObj && activeType && schemaObj[activeType]) {
            const entities = schemaObj[activeType];
            return (entities && Object.keys(entities).length > 0) ? entities as Record<string, any> : null;
        }
        return null;
    }
    // Use the computation function with $derived
    let currentEntityItems = $derived(computeCurrentEntityItems());


    // --- Effects ---
    $effect(() => {
        // This effect now reads the derived values directly
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
                const rawFetchedSchemasFromPrism = await apiStore.prism.getSchemas();
                const rawFetchedSchemas = rawFetchedSchemasFromPrism as any[]; // Assuming transformation is still needed

                const transformColumn = (apiCol: any): ColumnMetadata => ({
                    name: apiCol.name,
                    type: apiCol.type,
                    nullable: apiCol.nullable === true,
                    isPrimaryKey: apiCol.is_pk === true || apiCol.isPrimaryKey === true, // Handles both potential key names
                    isEnum: apiCol.is_enum === true,
                    references: apiCol.references ? {
                        schema: apiCol.references.schema_name || apiCol.references.schema,
                        table: apiCol.references.table,
                        column: apiCol.references.column,
                    } : undefined,
                });

                const transformTableOrView = (apiEntity: any, schemaName: string): TableMetadata | ViewMetadata => ({
                    name: apiEntity.name,
                    schema: apiEntity.schema_name || apiEntity.schema || schemaName,
                    columns: (apiEntity.columns || []).map(transformColumn),
                });
                
                const transformEnum = (apiEnum: any, schemaName: string): EnumMetadata => ({
                    name: apiEnum.name,
                    schema: apiEnum.schema_name || apiEnum.schema || schemaName,
                    values: apiEnum.values || [],
                });

                const transformFnParam = (param: any): FunctionParameter => ({
                    name: param.name,
                    type: param.type,
                    mode: param.mode || 'IN',
                    hasDefault: param.has_default === true,
                    defaultValue: param.default_value === undefined ? null : String(param.default_value),
                });

                const transformFunctionLike = (fn: any, schemaName: string): FunctionMetadata => ({
                    name: fn.name,
                    schema: fn.schema_name || fn.schema || schemaName,
                    type: String(fn.type), 
                    objectType: String(fn.object_type),
                    description: fn.description === undefined ? null : fn.description,
                    parameters: (fn.parameters || []).map(transformFnParam),
                    returnType: fn.return_type === undefined ? null : fn.return_type,
                    isStrict: fn.is_strict === true,
                    ...(fn.object_type && String(fn.object_type).includes('TRIGGER') && fn.trigger_data ? { triggerData: fn.trigger_data } : {})
                });

                const transformedSchemasResult: SchemaMetadata[] = rawFetchedSchemas.map((apiSchema: any) => ({
                    name: apiSchema.name,
                    tables: Object.fromEntries(Object.entries(apiSchema.tables || {}).map(([k, v]) => [k, transformTableOrView(v, apiSchema.name) as TableMetadata])),
                    views: Object.fromEntries(Object.entries(apiSchema.views || {}).map(([k, v]) => [k, transformTableOrView(v, apiSchema.name) as ViewMetadata])),
                    enums: Object.fromEntries(Object.entries(apiSchema.enums || {}).map(([k, v]) => [k, transformEnum(v, apiSchema.name)])),
                    functions: Object.fromEntries(Object.entries(apiSchema.functions || {}).map(([k, v]) => [k, transformFunctionLike(v, apiSchema.name)])),
                    procedures: Object.fromEntries(Object.entries(apiSchema.procedures || {}).map(([k, v]) => [k, transformFunctionLike(v, apiSchema.name)])),
                    triggers: Object.fromEntries(Object.entries(apiSchema.triggers || {}).map(([k, v]) => [k, transformFunctionLike(v, apiSchema.name)])),
                }));
                
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

    // --- Helper Functions ---
    function getEntityCount(schema: SchemaMetadata | null, entityType: StoreExplorerEntityType): number {
        if (!schema || !schema[entityType]) return 0;
        const entities = schema[entityType];
        return entities ? Object.keys(entities).length : 0;
    }

    function getColumnsForTableOrView(item: TableMetadata | ViewMetadata): ColumnMetadata[] {
        return item.columns || [];
    }
    
    // --- Modal Control Functions ---
    function openModalForApi( // Renamed to openModalForApi
        params: { operation: APIOperation },
        currentSchemaFromCall: string,
        currentResourceName: string,
        currentModalResourceType: ModalResourceType,
        options: {
            columns?: ColumnMetadata[];
            functionParams?: FunctionMetadata['parameters'] | null;
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
        modalTargetSchemaName = '';
        modalTargetResourceName = '';
        modalTargetColumns = [];
        modalTargetFunctionParams = null;
        modalInitialId = null;
        modalInitialDataForPut = {};
    }

    // --- Event Handlers / Callbacks from Child Components ---
    function handleFkReferenceClicked(ref: ColumnReference) {
        explorerStore.navigateToEntity(ref.schema, 'tables', ref.table);
    }

    function handleEnumBadgeClicked(enumData: { name: string; values: string[]; schema: string }) {
        currentEnumDetails = enumData; // { name, values, schema }
        showEnumModal = true;
    }
</script>

<!-- Template for src/lib/components/explorer/RLSchemaExplorer.svelte -->
<!-- This should be placed directly below the </script> tag from the previous response -->

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
                                {@const typedItem = itemData as (TableMetadata | ViewMetadata)}
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
                                        <span class="badge badge-ghost ml-2 capitalize">{explorerStore.activeEntityType.slice(0, -1)}</span>
                                    </div>
                                    <div class="collapse-content">
                                        <RLMetadataTable
                                            title={name}
                                            itemType={explorerStore.activeEntityType === 'tables' ? 'table' : 'view'}
                                            columns={getColumnsForTableOrView(typedItem)}
                                            enumsInSchema={activeSchema.enums}
                                            onFkClick={handleFkReferenceClicked}
                                            onEnumClick={(enumData) => handleEnumBadgeClicked({...enumData, schema: activeSchema.name})}
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
                                {@const typedItem = itemData as EnumMetadata}
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
                                        <button class="btn btn-xs btn-outline mt-2" onclick={() => handleEnumBadgeClicked({ name: typedItem.name, values: typedItem.values, schema: activeSchema.name })}>
                                            Show Details
                                        </button>
                                    </div>
                                </div>
                            <!-- Display for Functions, Procedures, Triggers -->
                            {:else if explorerStore.activeEntityType === 'functions' || explorerStore.activeEntityType === 'procedures' || explorerStore.activeEntityType === 'triggers'}
                                {@const typedItem = itemData as FunctionMetadata}
                                <div class="collapse collapse-arrow bg-base-100 shadow-md" id={entityId}>
                                    <input type="checkbox" name="item-accordion-{activeSchema.name}-{explorerStore.activeEntityType}-{name}" />
                                    <div 
                                        class="collapse-title text-xl font-medium"
                                        role="button"
                                        tabindex="0"
                                        onclick={(e) => { const input = e.currentTarget.previousElementSibling as HTMLInputElement; if(input) input.checked = !input.checked;}}
                                        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const input = e.currentTarget.previousElementSibling as HTMLInputElement; if(input) input.checked = !input.checked;}}}
                                    >
                                        {name} <span class="badge badge-ghost ml-2 capitalize">{(typedItem.objectType || explorerStore.activeEntityType).replace('ObjectType.', '').replace('FunctionType.','').toLowerCase()}</span>
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

                                        {#if explorerStore.activeEntityType === 'functions' || explorerStore.activeEntityType === 'procedures'}
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
                                                        { functionParams: typedItem.parameters }
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
            columns={modalTargetColumns}
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