<!-- src/lib/components/explorer/RLSchemaExplorer.svelte -->
<script lang="ts">
    import type {
        SchemaMetadata, // from prism-ts
        TableMetadata,  // from prism-ts
        ViewMetadata,   // from prism-ts
        EnumMetadata,   // from prism-ts
        FunctionMetadata, // from prism-ts (used for functions, procedures, triggers)
        ColumnMetadata,   // from prism-ts
        // FunctionParameter // from prism-ts (if needed directly, else part of FunctionMetadata)
    } from '@yrrrrrf/prism-ts'; // Adjusted import path if mod.ts re-exports these
    import { apiStore } from '$lib/components/stores/api.svelte';
    import RLMetadataTable from '$lib/components/dataview/RLMetadataTable.svelte';
    import RLApiInterface from '$lib/components/api/RLApiInterface.svelte';
    import RLApiOperationModal from '$lib/components/api/RLApiOperationModal.svelte';

    type APIOperation = 'GET' | 'POST' | 'PUT' | 'DELETE';
    type EntityType = 'tables' | 'views' | 'enums' | 'functions' | 'procedures' | 'triggers';
    type ModalResourceType = 'table' | 'view' | 'function'; // For RLApiOperationModal

    let schemas = $state<SchemaMetadata[] | null>(null);
    let activeSchemaName = $state<string | null>(null);
    let isLoading = $state(true);
    let error = $state<string | null>(null);
    let activeEntityType = $state<EntityType>('tables');

    // Modal state
    let isModalOpen = $state(false);
    let modalTargetSchemaName = $state<string>('');
    let modalTargetResourceName = $state<string>('');
    let modalTargetResourceType = $state<ModalResourceType>('table');
    let modalTargetColumns = $state<ColumnMetadata[]>([]);
    let modalTargetOperation = $state<APIOperation>('GET');
    let modalTargetFunctionParams = $state<FunctionMetadata['parameters'] | null>(null);
    let modalInitialId = $state<string | number | null>(null);
    let modalInitialDataForPut = $state<Record<string, any>>({});

    let currentSelectedSchemaObject = $state<SchemaMetadata | null>(null);
    let currentEntityItems = $state<Record<string, any> | null>(null); // Holds items for the activeEntityType

    // Effect to update currentSelectedSchemaObject when activeSchemaName or schemas change
    $effect(() => {
        if (!activeSchemaName || !schemas) {
            currentSelectedSchemaObject = null;
        } else {
            currentSelectedSchemaObject = schemas.find(s => s.name === activeSchemaName) || null;
        }
    });

    // Effect to update currentEntityItems when currentSelectedSchemaObject or activeEntityType changes
    $effect(() => {
        if (currentSelectedSchemaObject && currentSelectedSchemaObject[activeEntityType]) {
            const entities = currentSelectedSchemaObject[activeEntityType];
            // Check if entities is not null/undefined and has keys
            if (entities && Object.keys(entities).length > 0) {
                currentEntityItems = entities as Record<string, any>;
            } else {
                currentEntityItems = null;
            }
        } else {
            currentEntityItems = null;
        }
    });

    // Effect to load schemas from the API
    $effect(() => {
        async function loadSchemas() {
            if (!apiStore.IS_CONNECTED || !apiStore.prism) {
                isLoading = !apiStore.IS_CONNECTED; // Show loading if not connected yet
                error = apiStore.IS_CONNECTED ? null : "API not connected. Waiting for connection...";
                schemas = null; // Clear schemas if not connected
                return;
            }

            try {
                isLoading = true;
                error = null;
                // apiStore.prism.getSchemas() should return SchemaMetadata[] from prism-ts
                const fetchedSchemasFromPrismTs = await apiStore.prism.getSchemas();

                // Ensure all expected top-level entity collections exist on each schema object.
                // This is a defensive measure. prism-ts should ideally provide complete objects.
                const ensuredSchemas: SchemaMetadata[] = fetchedSchemasFromPrismTs.map(schema => ({
                    name: schema.name,
                    tables: schema.tables || {},
                    views: schema.views || {},
                    enums: schema.enums || {},
                    functions: schema.functions || {},
                    procedures: schema.procedures || {},
                    triggers: schema.triggers || {},
                }));
                
                schemas = ensuredSchemas;

                if (ensuredSchemas && ensuredSchemas.length > 0 && !activeSchemaName) {
                    activeSchemaName = ensuredSchemas[0].name;
                }
            } catch (e) {
                console.error("Error loading schemas:", e);
                error = e instanceof Error ? e.message : 'An unknown error occurred while fetching schemas.';
                schemas = null;
            } finally {
                isLoading = false;
            }
        }
        loadSchemas();
    });

    function getEntityCount(schema: SchemaMetadata | null, entityType: EntityType): number {
        if (!schema || !schema[entityType]) return 0;
        const entities = schema[entityType];
        return entities ? Object.keys(entities).length : 0;
    }

    // RLMetadataTable expects ColumnMetadata[] from prism-ts, which should be directly available.
    function getColumnsForTableOrView(item: TableMetadata | ViewMetadata): ColumnMetadata[] {
        return item.columns || [];
    }
    
    function openModalForOperation(
        params: { operation: APIOperation },
        currentSchema: string,
        currentResourceName: string,
        currentModalResourceType: ModalResourceType, // 'table', 'view', or 'function'
        options: {
            columns?: ColumnMetadata[];
            functionParams?: FunctionMetadata['parameters'] | null;
            initialId?: string | number | null;
            initialDataForPut?: Record<string, any>;
        } = {}
    ) {
        modalTargetOperation = params.operation;
        modalTargetSchemaName = currentSchema;
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
        // Reset modal-specific states if necessary
        modalTargetFunctionParams = null;
        modalInitialId = null;
        modalInitialDataForPut = {};
        modalTargetColumns = [];
    }
</script>

<!-- src/lib/components/explorer/RLSchemaExplorer.svelte -->
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
                <h3 class="font-bold">Error Loading Schemas!</h3>
                <div class="text-xs">{error}</div>
            </div>
        </div>
    {:else if schemas && schemas.length > 0}
        <div role="tablist" class="tabs tabs-lifted tabs-lg mb-6">
             {#each schemas as schema (schema.name)}
                <button
                    role="tab"
                    class="tab {activeSchemaName === schema.name ? 'tab-active font-semibold' : ''}"
                    onclick={() => { activeSchemaName = schema.name; activeEntityType = 'tables';}}
                    aria-selected={activeSchemaName === schema.name}
                >
                    {schema.name}
                </button>
            {/each}
        </div>

        {#if currentSelectedSchemaObject}
            {@const activeSchema = currentSelectedSchemaObject}
            <div class="bg-base-200 p-4 rounded-box">
                <div role="tablist" class="tabs tabs-bordered mb-6">
                    {#each ['tables', 'views', 'enums', 'functions', 'procedures', 'triggers'] as typeStr}
                        {@const entityTypeLoop = typeStr as EntityType}
                        {@const count = getEntityCount(activeSchema, entityTypeLoop)}
                        <button
                            role="tab"
                            class="tab {activeEntityType === entityTypeLoop ? 'tab-active' : ''} [--tab-bg:oklch(var(--b2))] [--tab-border-color:oklch(var(--b3))]"
                            onclick={() => activeEntityType = entityTypeLoop}
                            aria-selected={activeEntityType === entityTypeLoop}
                            disabled={count === 0 && activeEntityType !== entityTypeLoop}
                        >
                            {entityTypeLoop.charAt(0).toUpperCase() + entityTypeLoop.slice(1)}
                            <span class="badge badge-sm badge-ghost ml-2">{count}</span>
                        </button>
                    {/each}
                </div>

                <div class="space-y-6">
                    {#if currentEntityItems && Object.keys(currentEntityItems).length > 0}
                        {#each Object.entries(currentEntityItems) as [name, itemData] (name)}
                            <!-- Display for Tables and Views -->
                            {#if activeEntityType === 'tables' || activeEntityType === 'views'}
                                {@const typedItem = itemData as (TableMetadata | ViewMetadata)}
                                <div class="collapse collapse-arrow bg-base-100 shadow-md">
                                    <input type="checkbox" name="item-accordion-{activeSchema.name}-{activeEntityType}-{name}" />
                                    <div class="collapse-title text-xl font-medium">
                                        {name}
                                        <span class="badge badge-ghost ml-2 capitalize">{activeEntityType.slice(0, -1)}</span>
                                    </div>
                                    <div class="collapse-content">
                                        <RLMetadataTable 
                                            title={name} 
                                            itemType={activeEntityType === 'tables' ? 'table' : 'view'} 
                                            columns={getColumnsForTableOrView(typedItem)} 
                                        />
                                        <div class="mt-4 p-2 border-t border-base-300">
                                            <RLApiInterface
                                                schemaName={activeSchema.name}
                                                resourceName={name}
                                                resourceType={activeEntityType === 'tables' ? 'table' : 'view'}
                                                columns={getColumnsForTableOrView(typedItem)}
                                                onOpenModal={(opParams) => openModalForOperation(
                                                    opParams, 
                                                    activeSchema.name, 
                                                    name, 
                                                    activeEntityType === 'tables' ? 'table' : 'view', 
                                                    { columns: getColumnsForTableOrView(typedItem) }
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            <!-- Display for Enums -->
                            {:else if activeEntityType === 'enums'}
                                {@const typedItem = itemData as EnumMetadata}
                                <div class="collapse collapse-arrow bg-base-100 shadow-md">
                                    <input type="checkbox" name="item-accordion-{activeSchema.name}-enum-{name}" />
                                    <div class="collapse-title text-xl font-medium">
                                        {name} <span class="badge badge-ghost ml-2">Enum</span>
                                    </div>
                                    <div class="collapse-content">
                                        <p class="font-semibold">Values:</p>
                                        <ul class="list-disc list-inside pl-4 font-mono text-xs">
                                            {#each typedItem.values as value}
                                                <li>{value}</li>
                                            {/each}
                                        </ul>
                                    </div>
                                </div>
                            <!-- Display for Functions, Procedures, Triggers -->
                            {:else if activeEntityType === 'functions' || activeEntityType === 'procedures' || activeEntityType === 'triggers'}
                                {@const typedItem = itemData as FunctionMetadata}
                                <div class="collapse collapse-arrow bg-base-100 shadow-md">
                                    <input type="checkbox" name="item-accordion-{activeSchema.name}-{activeEntityType}-{name}" />
                                    <div class="collapse-title text-xl font-medium">
                                        {name} <span class="badge badge-ghost ml-2 capitalize">{typedItem.objectType || activeEntityType.slice(0,-1)}</span>
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
                                                        {#each typedItem.parameters as param}
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
                                        
                                        {#if activeEntityType === 'functions' || activeEntityType === 'procedures'}
                                            <div class="mt-4 p-2 border-t border-base-300">
                                                <RLApiInterface
                                                    schemaName={activeSchema.name}
                                                    resourceName={name}
                                                    resourceType={'function'}
                                                    columns={[]}
                                                    onOpenModal={(opParams) => openModalForOperation(
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
                            <p class="text-lg text-neutral-content/70">No {activeEntityType} found in schema <span class="font-semibold text-primary">{activeSchema.name}</span>.</p>
                            <p class="text-sm text-neutral-content/50">Ensure the API is providing data for this entity type or select another type.</p>
                        </div>
                    {/if}
                </div>
            </div>
        {:else if !isLoading} <!-- currentSelectedSchemaObject is null but not loading -->
            <div role="alert" class="alert alert-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>Please select a schema to explore its contents.</span>
            </div>
        {/if}
    {:else if !isLoading && (!schemas || schemas.length === 0)} <!-- No schemas loaded at all -->
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
</div>