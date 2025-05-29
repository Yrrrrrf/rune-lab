<!-- src/lib/components/explorer/RLSchemaExplorer.svelte -->
<script lang="ts">
    import type {
        SchemaMetadata,
        TableMetadata,
        ViewMetadata, // Kept for type consistency, though 'views' collection will be empty
        EnumMetadata,   // Kept for type consistency
        FunctionMetadata, // Kept for type consistency
        ColumnMetadata,
        ColumnReference
    } from '@yrrrrrf/prism-ts';
    import { apiStore } from '$lib/components/stores/api.svelte';
    import RLMetadataTable from '$lib/components/dataview/RLMetadataTable.svelte';
    import RLApiInterface from '$lib/components/api/RLApiInterface.svelte';
    import RLApiOperationModal from '$lib/components/api/RLApiOperationModal.svelte';

    type APIOperation = 'GET' | 'POST' | 'PUT' | 'DELETE';
    // EntityType now reflects what we can *actually* populate based on API
    // We will have 'tables', and the rest will be empty unless API changes.
    type EntityType = 'tables' | 'views' | 'enums' | 'functions' | 'procedures' | 'triggers';
    type ModalResourceType = 'table' | 'view' | 'function';

    let schemas = $state<SchemaMetadata[] | null>(null);
    let activeSchemaName = $state<string | null>(null);
    let isLoading = $state(true);
    let error = $state<string | null>(null);
    let activeEntityType = $state<EntityType>('tables'); // Default to 'tables'

    // Modal state - remains the same
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
    let currentEntityItems = $state<Record<string, any> | null>(null); // Will hold items from schema.tables

    $effect(() => {
        if (!activeSchemaName || !schemas) {
            currentSelectedSchemaObject = null;
        } else {
            currentSelectedSchemaObject = schemas.find(s => s.name === activeSchemaName) || null;
        }
    });

    $effect(() => {
        if (!currentSelectedSchemaObject) {
            currentEntityItems = null;
            return;
        }
        const entityData = currentSelectedSchemaObject[activeEntityType];
        currentEntityItems = entityData && Object.keys(entityData).length > 0 
            ? entityData as Record<string, any> 
            : null;
    });

    // In RLSchemaExplorer.svelte - $effect for loading schemas
    $effect(() => {
        async function loadSchemas() {
            if (apiStore.IS_CONNECTED && apiStore.prism) {
                try {
                    isLoading = true;
                    error = null;
                    const fetchedSchemas = await apiStore.prism.getSchemas() as any[]; // Cast to any[] to be safe before ensuring structure
                    
                    console.log("DEBUG: Raw fetchedSchemas:", JSON.stringify(fetchedSchemas, null, 2));

                    const ensuredSchemas: SchemaMetadata[] = fetchedSchemas.map(schema => ({
                        name: schema.name,
                        tables: schema.tables || {}, // If API omits 'tables' when empty, default to {}
                        views: schema.views || {},       // If API omits 'views' when empty, default to {}
                        enums: schema.enums || {},       // etc.
                        functions: schema.functions || {},
                        procedures: schema.procedures || {},
                        triggers: schema.triggers || {},
                        // Ensure all other properties of SchemaMetadata are here if prism-ts defines them
                        // and provide defaults if they can be omitted by the API.
                    }));
                    
                    schemas = ensuredSchemas;
                    // console.log("DEBUG: Ensured Schemas:", JSON.stringify(schemas, null, 2));


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
            } else if (!apiStore.IS_CONNECTED) {
                // ...
            }
        }
        loadSchemas();
    });

    function getEntityCount(schema: SchemaMetadata | null, entityType: EntityType): number {
        if (!schema || !schema[entityType]) return 0;
        const entities = schema[entityType];
        return entities ? Object.keys(entities).length : 0;
    }

    function getColumnsForTableOrView(item: TableMetadata | ViewMetadata): ColumnMetadata[] {
        return item.columns || [];
    }
    
    function openModalForOperation( /* ... (this function remains the same as previous correct version) ... */
        params: { operation: APIOperation },
        currentSchema: string,
        currentResourceName: string,
        currentModalResourceType: ModalResourceType,
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

    function closeModal() { /* ... (this function remains the same) ... */
        isModalOpen = false;
        modalTargetFunctionParams = null;
        modalInitialId = null;
        modalInitialDataForPut = {};
        modalTargetColumns = [];
    }
</script>

<!-- 
  TEMPLATE:
  The template will now only populate the "Tables" tab with content.
  "Views", "Enums", "Functions", "Procedures", "Triggers" tabs will show 0 counts and "No items found".
  This accurately reflects the limitations of the API data.
-->
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
                    class="tab {activeSchemaName === schema.name ? 'tab-active font-semibold' : ''}"
                    onclick={() => activeSchemaName = schema.name}
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
                            disabled={count === 0}
                        >
                            {entityTypeLoop.charAt(0).toUpperCase() + entityTypeLoop.slice(1)}
                            <span class="badge badge-sm badge-ghost ml-2">{count}</span>
                        </button>
                    {/each}
                </div>

                <div class="space-y-6">
                    <!-- TABLES: This section will now show ALL entities received from the API's "tables" key -->
                    {#if activeEntityType === 'tables'}
                        {#if currentEntityItems && Object.keys(currentEntityItems).length > 0}
                            {#each Object.entries(currentEntityItems) as [name, itemData] (name)}
                                {@const typedItem = itemData as TableMetadata} <!-- All are treated as TableMetadata now -->
                                <div class="collapse collapse-arrow bg-base-100 shadow-md">
                                    <input type="checkbox" name="item-accordion-table-{activeSchema.name}-{name}" />
                                    <div class="collapse-title text-xl font-medium">
                                        {name} 
                                        <!-- We can't reliably know if it's a table or view, so we'll call it 'data entity' or similar -->
                                        <span class="badge badge-ghost ml-2">Data Entity</span> 
                                    </div>
                                    <div class="collapse-content">
                                        <RLMetadataTable title={name} itemType={'table'} columns={getColumnsForTableOrView(typedItem)} />
                                        <div class="mt-4 p-2 border-t border-base-300">
                                            <!-- API interface will treat it as a table by default -->
                                            <RLApiInterface schemaName={activeSchema.name} resourceName={name} resourceType={'table'} columns={getColumnsForTableOrView(typedItem)}
                                                onOpenModal={(opParams) => openModalForOperation(opParams, activeSchema.name, name, 'table', { columns: getColumnsForTableOrView(typedItem) })} />
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        {:else}
                            <p class="text-center p-4 text-neutral-content/70">No data entities found in the 'tables' collection from API for this schema.</p>
                        {/if}
                    <!-- VIEWS / ENUMS / FUNCTIONS / PROCEDURES / TRIGGERS: These will now show "No ... found" -->
                    {:else if activeEntityType === 'views'}
                        <p class="text-center p-4 text-neutral-content/70">No views found (API does not provide a separate 'views' collection).</p>
                    {:else if activeEntityType === 'enums'}
                        <p class="text-center p-4 text-neutral-content/70">No enums found (API does not provide a separate 'enums' collection with 'values').</p>
                    {:else if activeEntityType === 'functions' || activeEntityType === 'procedures' || activeEntityType === 'triggers'}
                        <p class="text-center p-4 text-neutral-content/70">No {activeEntityType} found (API does not provide a separate '{activeEntityType}' collection with parameters/details).</p>
                    {/if}
                </div>
            </div>
        {:else if !isLoading}
            <div role="alert" class="alert alert-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>Please select a schema, or ensure API connection.</span>
            </div>
        {/if}
    {:else if !isLoading && (!schemas || schemas.length === 0)}
         <div role="alert" class="alert">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-info shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>No schemas found. Check API configuration and connection.</span>
        </div>
    {/if}

    {#if isModalOpen && modalTargetSchemaName && modalTargetResourceName && modalTargetOperation}
        <RLApiOperationModal isOpen={isModalOpen} onClose={closeModal} schemaName={modalTargetSchemaName} resourceName={modalTargetResourceName} operation={modalTargetOperation} columns={modalTargetColumns} functionParams={modalTargetFunctionParams} resourceType={modalTargetResourceType} initialId={modalInitialId} initialDataForPut={modalInitialDataForPut} />
    {/if}
</div>