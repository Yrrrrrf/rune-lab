<!-- src/lib/components/explorer/RLSchemaExplorer.svelte -->
<script lang="ts">
    // --- Base Imports ---
    import { apiStore } from '$lib/components/stores/api.svelte';
    import { 
        explorerStore, 
        type ExplorerEntityType as StoreExplorerEntityType,
        // Assuming RL types are now here as per your latest file structure:
        type RLApiInterfaceActionParams,
        type RLSchemaData, 
        type RLTableMetadata, 
        type RLViewMetadata, 
        type RLEnumMetadata, 
        type RLFunctionMetadata, 
        type RLColumnMetadata, 
        type RLColumnReference,
        type RLFunctionParameter // Add if needed, but child components will use RLFunctionParameter from func.parameters
    } from '$lib/components/stores/explorer.svelte'; // YOU ARE USING THIS.

    // --- Prism-TS Types (only for what RLApiOperationModal strictly needs IF NOT ADAPTED) ---
    import type {
        SchemaMetadata as PrismSchemaMetadata,
        ColumnMetadata as PrismColumnMetadata, // For RLApiOperationModal prop
        FunctionParameter as PrismFunctionParameter, // For RLApiOperationModal prop
    } from '@yrrrrrf/prism-ts';

    // --- Transformation Tool ---
    import { transformPrismSchemasToRLData } from '$lib/tools/schema-transformer.js';

    // --- Child Components ---
    import RLTableDisplay from './RLTableDisplay.svelte';
    import RLViewDisplay from './RLViewDisplay.svelte';
    import RLEnumDisplay from './RLEnumDisplay.svelte';
    import RLFunctionDisplay from './RLFunctionDisplay.svelte';
    
    // --- API Modal & Interface ---
    // RLApiInterface is used *within* child components like RLTableDisplay now, so not directly here.
    import RLApiOperationModal from '$lib/components/api/RLApiOperationModal.svelte';


    // --- Local Types ---
    // RLApiInterfaceActionParams['operation'] is already 'GET' | 'POST' | ...
    type APIOperation = RLApiInterfaceActionParams['operation'];
    type ModalResourceType = 'table' | 'view' | 'function';

    // --- Component State ($state) ---
    let schemas = $state<RLSchemaData[] | null>(null);
    let isLoading = $state(true);
    let error = $state<string | null>(null);

    // Modal state for API Operations
    let isModalOpen = $state(false);
    let modalTargetSchemaName = $state<string>('');
    let modalTargetResourceName = $state<string>('');
    let modalTargetResourceType = $state<ModalResourceType>('table');
    // This `modalTargetColumns` will be populated with RLColumnMetadata from options,
    // but RLApiOperationModal prop `columns` expects PrismColumnMetadata[].
    // Casting will happen when passing to RLApiOperationModal.
    let modalTargetColumns = $state<RLColumnMetadata[]>([]);
    let modalTargetOperation = $state<APIOperation>('GET');
    // modalTargetFunctionParams is for RLApiOperationModal which expects PrismFunctionParameter[]
    let modalTargetFunctionParams = $state<PrismFunctionParameter[] | null>(null);
    let modalInitialId = $state<string | number | null>(null);
    let modalInitialDataForPut = $state<Record<string, any>>({});

    // Modal state for Enum Details (if any are shown directly by RLSchemaExplorer)
    let showEnumDetailModal = $state(false);
    let currentEnumDetailsForModal = $state<{ name: string; values: string[]; schema: string } | null>(null);

    // --- Derived State ($derived) ---
    function computeCurrentSelectedSchema(): RLSchemaData | null {
        const activeName = explorerStore.activeSchemaName;
        const currentSchemas = schemas; // Access $state variable's value
        if (!activeName || !currentSchemas) return null;
        return currentSchemas.find(s => s.name === activeName) || null;
    }
    let currentSelectedSchemaObject = $derived(computeCurrentSelectedSchema());

    function computeCurrentEntityItems(): Record<string, any> | null {
        const schemaObj = currentSelectedSchemaObject;
        const activeType = explorerStore.activeEntityType;
        if (schemaObj && activeType && schemaObj[activeType as keyof RLSchemaData]) {
            const entities = schemaObj[activeType as keyof RLSchemaData];
            if (entities && typeof entities === 'object' && !Array.isArray(entities)) {
                 return (Object.keys(entities).length > 0) ? entities as Record<string, any> : null;
            }
        }
        return null;
    }
    let currentEntityItems = $derived(computeCurrentEntityItems());

    // --- Effects ($effect) ---
    $effect(() => { // Scroll to focused entity
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
                    inputElement.checked = true; // Auto-open the details
                }
            }
        }
    });

    $effect(() => { // Load and transform schemas
        async function loadAndTransformSchemas() {
            if (!apiStore.IS_CONNECTED || !apiStore.prism) {
                // ... (error/loading state handling)
                isLoading = !apiStore.IS_CONNECTED;
                error = apiStore.IS_CONNECTED ? null : "API not connected. Waiting for connection...";
                schemas = null;
                return;
            }
            try {
                isLoading = true; error = null;
                const rawPrismSchemas = await apiStore.prism.getSchemas() as PrismSchemaMetadata[];
                const transformedRLSchemas = transformPrismSchemasToRLData(rawPrismSchemas);
                schemas = transformedRLSchemas;

                if (transformedRLSchemas.length > 0 && !explorerStore.activeSchemaName) {
                    explorerStore.selectSchema(transformedRLSchemas[0].name);
                } else if (explorerStore.activeSchemaName && !transformedRLSchemas.find(s => s.name === explorerStore.activeSchemaName)) {
                    explorerStore.selectSchema(transformedRLSchemas.length > 0 ? transformedRLSchemas[0].name : null);
                }
            } catch (e) {
                console.error("[RLSchemaExplorer] Error loading/transforming schemas:", e);
                error = e instanceof Error ? e.message : 'Unknown schema processing error.';
                schemas = null;
            } finally {
                isLoading = false;
            }
        }
        loadAndTransformSchemas();
    });

    // --- Helper Functions ---
    function getEntityCount(schema: RLSchemaData | null, entityType: StoreExplorerEntityType): number {
        if (!schema || !schema[entityType as keyof RLSchemaData]) return 0;
        const entities = schema[entityType as keyof RLSchemaData];
        return (entities && typeof entities === 'object' && !Array.isArray(entities)) ? Object.keys(entities).length : 0;
    }

    // --- Event Handlers & Modal Control ---
    function openModalForApi(
        actionParams: RLApiInterfaceActionParams,
        currentSchema: string,
        currentResource: string,
        resourceGuiType: ModalResourceType, // 'table', 'view', or 'function' for modal's internal logic
        options: {
            columns?: RLColumnMetadata[]; // Receives RLColumnMetadata
            functionParams?: RLFunctionParameter[] | null; // Receives RLFunctionParameter[] from RLFunctionDisplay
                                                        // But modalTargetFunctionParams expects PrismFunctionParameter[]
            initialId?: string | number | null;
            initialDataForPut?: Record<string, any>;
        } = {}
    ): void {
        modalTargetOperation = actionParams.operation;
        modalTargetSchemaName = currentSchema;
        modalTargetResourceName = currentResource;
        modalTargetResourceType = resourceGuiType;
        
        // Important: `modalTargetColumns` is `RLColumnMetadata[]` from the options.
        // `RLApiOperationModal`'s `columns` prop expects `PrismColumnMetadata[]`.
        // We will handle casting directly when passing the prop to the modal.
        modalTargetColumns = options.columns || []; 
        
        // Similarly for functionParams: RLFunctionDisplay sends RLFunctionParameter[]
        // RLApiOperationModal expects PrismFunctionParameter[].
        // We store what RLFunctionDisplay gives, and cast for the modal prop.
        // If options.functionParams is RLFunctionParameter[], it should be compatible for casting
        modalTargetFunctionParams = options.functionParams as unknown as PrismFunctionParameter[] || null;

        modalInitialId = options.initialId || null;
        modalInitialDataForPut = options.initialDataForPut || {};
        isModalOpen = true;
    }

    function closeModalForApi() {
        isModalOpen = false;
        // Optionally reset other modal target states here if not reset on open
    }

    function handleFkReferenceClicked(ref: RLColumnReference) {
        explorerStore.navigateToEntity(ref.schema, 'tables', ref.table);
    }

    // This handler is for when an enum is clicked (e.g., from RLTableDisplay, RLViewDisplay)
    function handleEnumDetailClick(enumData: RLEnumMetadata) {
        currentEnumDetailsForModal = { name: enumData.name, values: enumData.values, schema: enumData.schema };
        showEnumDetailModal = true;
    }

    function closeEnumDetailModal() {
        showEnumDetailModal = false;
    }

</script>

<div class="container mx-auto p-4">
    <!-- Loading, Error, Schema Tabs, Breadcrumbs ... (same as before) ... -->
    {#if isLoading}
        <!-- 
            <div class="flex flex-col items-center justify-center h-64">
                <span class="loading loading-spinner loading-lg text-primary"></span>
                <p class="mt-4 text-neutral-content/80">{error || 'Loading schemas...'}</p>
            </div>
         -->
    {:else if error && !isLoading}
        <!--
            <div role="alert" class="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div><h3 class="font-bold">Error Loading/Preparing Schemas!</h3><div class="text-xs">{error}</div></div>
            </div>
        -->
    {:else if schemas && schemas.length > 0}
        <div role="tablist" class="tabs tabs-lifted tabs-lg mb-6">
             {#each schemas as schema (schema.name)}
                <button role="tab" class="tab {explorerStore.activeSchemaName === schema.name ? 'tab-active font-semibold' : ''}"
                    onclick={() => explorerStore.selectSchema(schema.name)} aria-selected={explorerStore.activeSchemaName === schema.name}>
                    {schema.name}
                </button>
            {/each}
        </div>

        {#if currentSelectedSchemaObject}
            {@const activeSchema = currentSelectedSchemaObject}
            {#if explorerStore.breadcrumbs.length > 1}
                 <div class="mb-3">
                    <button class="btn btn-xs btn-ghost" onclick={() => explorerStore.goBack()}>
                         <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8l8 8l1.41-1.41L7.83 13H20z"/></svg> Back
                    </button>
                </div>
            {/if}
            
            <div class="bg-base-200 p-4 rounded-box">
                <!-- Entity Type Tabs ... (same as before) ... -->
                <div role="tablist" class="tabs tabs-bordered mb-6">
                    {#each (['tables', 'views', 'enums', 'functions', 'procedures', 'triggers'] as const) satisfies StoreExplorerEntityType[] as entityTypeLoop}
                        {@const count = getEntityCount(activeSchema, entityTypeLoop)}
                        <button role="tab" class="tab {explorerStore.activeEntityType === entityTypeLoop ? 'tab-active' : ''} [--tab-bg:oklch(var(--b2))] [--tab-border-color:oklch(var(--b3))]"
                            onclick={() => explorerStore.selectEntityType(entityTypeLoop)}
                            aria-selected={explorerStore.activeEntityType === entityTypeLoop}
                            disabled={count === 0 && explorerStore.activeEntityType !== entityTypeLoop}>
                            {entityTypeLoop.charAt(0).toUpperCase() + entityTypeLoop.slice(1)}
                            <span class="badge badge-sm badge-ghost ml-2">{count}</span>
                        </button>
                    {/each}
                </div>

                <div class="space-y-6">
                    {#if currentEntityItems && Object.keys(currentEntityItems).length > 0}
                        {#each Object.entries(currentEntityItems) as [name, itemDataUntyped] (activeSchema.name + explorerStore.activeEntityType + name)}
                            {@const entityId = `entity-${activeSchema.name}-${explorerStore.activeEntityType}-${name}`}
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
                                    class="collapse-title text-xl font-medium" role="button" tabindex="0"
                                    onclick={() => explorerStore.focusOnEntity(explorerStore.focusedEntityName === name ? null : name)}
                                    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); explorerStore.focusOnEntity(explorerStore.focusedEntityName === name ? null : name);}}}>
                                    {name}
                                    <span class="badge badge-ghost ml-2 capitalize">
                                        {#if explorerStore.activeEntityType === 'tables'}Table
                                        {:else if explorerStore.activeEntityType === 'views'}View
                                        {:else if explorerStore.activeEntityType === 'enums'}Enum
                                        {:else}{(itemDataUntyped as RLFunctionMetadata).kind?.toLowerCase() || explorerStore.activeEntityType.slice(0, -1)}
                                        {/if}
                                    </span>
                                </div>
                                <div class="collapse-content">
                                    {#if explorerStore.activeEntityType === 'tables'}
                                        {@const item = itemDataUntyped as RLTableMetadata}
                                        <RLTableDisplay
                                            table={item}
                                            enumsInSchema={activeSchema.enums}
                                            onFkClick={handleFkReferenceClicked}
                                            onEnumClick={handleEnumDetailClick}
                                            onOpenApiModal={(eventDetail) => openModalForApi(
                                                { operation: eventDetail.operation },
                                                eventDetail.schemaName, eventDetail.resourceName, 
                                                eventDetail.resourceType as ModalResourceType, eventDetail.options
                                            )}
                                        />
                                    {:else if explorerStore.activeEntityType === 'views'}
                                        {@const item = itemDataUntyped as RLViewMetadata}
                                        <RLViewDisplay
                                            view={item}
                                            enumsInSchema={activeSchema.enums}
                                            onEnumClick={handleEnumDetailClick}
                                            onOpenApiModal={(eventDetail) => openModalForApi(
                                                { operation: eventDetail.operation },
                                                eventDetail.schemaName, eventDetail.resourceName, 
                                                eventDetail.resourceType as ModalResourceType, eventDetail.options
                                            )}
                                        />
                                    {:else if explorerStore.activeEntityType === 'enums'}
                                        {@const item = itemDataUntyped as RLEnumMetadata}
                                        <RLEnumDisplay enumData={item} />
                                        <!-- If RLEnumDisplay needs to open the modal, it should emit an event handled here -->
                                        <button class="btn btn-xs btn-outline mt-2" onclick={() => handleEnumDetailClick(item)}>
                                            Show Values
                                        </button>
                                    {:else if ['functions', 'procedures', 'triggers'].includes(explorerStore.activeEntityType)}
                                        {@const item = itemDataUntyped as RLFunctionMetadata}
                                        <RLFunctionDisplay
                                            func={item}
                                            onOpenApiModal={(eventDetail) => openModalForApi(
                                                { operation: eventDetail.operation },
                                                eventDetail.schemaName, eventDetail.resourceName, 
                                                eventDetail.resourceType as ModalResourceType, eventDetail.options
                                            )}
                                        />
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    {:else}
                        <!-- No items message ... (same as before) ... -->
                        <div class="text-center p-6 bg-base-100 rounded-md shadow">
                            <p class="text-lg text-neutral-content/70">No {explorerStore.activeEntityType} found in schema <span class="font-semibold text-primary">{activeSchema.name}</span>.</p>
                        </div>
                    {/if}
                </div>
            </div>
        {:else if !isLoading}
             <!-- Select a schema message ... (same as before) ... -->
            <div role="alert" class="alert alert-info">... Please select a schema ...</div>
        {/if}
    {:else if !isLoading && (!schemas || schemas.length === 0)}
        <!-- No schemas found message ... (same as before) ... -->
        <div role="alert" class="alert">... No schemas found ...</div>
    {/if}

    <!-- API Operation Modal -->
    {#if isModalOpen && modalTargetSchemaName && modalTargetResourceName}
        <RLApiOperationModal
            isOpen={isModalOpen}
            onClose={closeModalForApi}
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

    <!-- Enum Detail Modal -->
    {#if showEnumDetailModal && currentEnumDetailsForModal}
        <dialog class="modal modal-open" open onclose={closeEnumDetailModal}>
            <div class="modal-box">
                <form method="dialog"><button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onclick={closeEnumDetailModal}>✕</button></form>
                <h3 class="font-bold text-lg">Enum: <span class="font-mono badge badge-outline">{currentEnumDetailsForModal.name}</span></h3>
                <p class="py-1"><span class="font-semibold">Schema:</span> <span class="font-mono badge badge-ghost">{currentEnumDetailsForModal.schema}</span></p>
                <p class="font-semibold mt-3 mb-1">Values:</p>
                <div class="max-h-60 overflow-y-auto bg-base-200 p-3 rounded-md">
                    <ul class="list-disc list-inside pl-2 space-y-1">
                        {#each currentEnumDetailsForModal.values as value}
                            <li class="font-mono text-sm">{value}</li>
                        {/each}
                    </ul>
                </div>
                <div class="modal-action mt-4"><button class="btn" onclick={closeEnumDetailModal}>Close</button></div>
            </div>
            <form method="dialog" class="modal-backdrop"><button onclick={closeEnumDetailModal}>close</button></form>
        </dialog>
    {/if}
</div>