<!-- src/lib/components/explorer/RLSchemaExplorer.svelte -->
<script lang="ts">
    import type {
        SchemaMetadata,
        TableMetadata,
        ViewMetadata,
        EnumMetadata,
        FunctionMetadata,
        ColumnMetadata
    } from '@yrrrrrf/prism-ts';
    import { apiStore } from '$lib/components/stores/api.svelte';
    import RLMetadataTable from '$lib/components/dataview/RLMetadataTable.svelte';
    import RLApiInterface from '$lib/components/api/RLApiInterface.svelte';

    type EntityType = 'tables' | 'views' | 'enums' | 'functions' | 'procedures' | 'triggers';

    let schemas = $state<SchemaMetadata[] | null>(null);
    let activeSchemaName = $state<string | null>(null);
    let isLoading = $state(true);
    let error = $state<string | null>(null);
    let activeEntityType = $state<EntityType>('tables');

    // --- NEW APPROACH: Use $effect to update $state variables ---
    let currentSelectedSchemaObject = $state<SchemaMetadata | null>(null);
    let currentEntityItems = $state<Record<string, any> | null>(null);

    // Effect to update currentSelectedSchemaObject
    $effect(() => {
        if (!activeSchemaName || !schemas) {
            currentSelectedSchemaObject = null;
        } else {
            const found = schemas.find(s => s.name === activeSchemaName);
            currentSelectedSchemaObject = found || null;
        }
    });

    // Effect to update currentEntityItems
    $effect(() => {
        if (!currentSelectedSchemaObject || !currentSelectedSchemaObject[activeEntityType]) {
            currentEntityItems = null;
        } else {
            currentEntityItems = currentSelectedSchemaObject[activeEntityType] as Record<string, any> | null;
        }
    });
    // --- END NEW APPROACH ---

    $effect(() => {
        async function loadSchemas() {
            if (apiStore.IS_CONNECTED && apiStore.prism) {
                try {
                    isLoading = true;
                    error = null;
                    await apiStore.prism.initialize();
                    const fetchedSchemas = await apiStore.prism.getSchemas();
                    schemas = fetchedSchemas;
                    if (fetchedSchemas && fetchedSchemas.length > 0 && !activeSchemaName) {
                        activeSchemaName = fetchedSchemas[0].name;
                    }
                } catch (e) {
                    console.error("Error loading schemas:", e);
                    error = e instanceof Error ? e.message : 'An unknown error occurred while fetching schemas.';
                    schemas = null;
                } finally {
                    isLoading = false;
                }
            } else if (!apiStore.IS_CONNECTED) {
                isLoading = true;
                error = "API not connected. Waiting for connection...";
                schemas = null;
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

</script>

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
        <!-- Schema Selection Tabs -->
        <div role="tablist" class="tabs tabs-lifted tabs-lg mb-6">
            {#each schemas as schema}
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
                <!-- Entity Type Selection Tabs -->
                <div role="tablist" class="tabs tabs-bordered mb-6">
                    {#each ['tables', 'views', 'enums', 'functions', 'procedures', 'triggers'] as typeStr}
                        {@const entityType = typeStr as EntityType}
                        {@const count = getEntityCount(activeSchema, entityType)}
                        <button
                            role="tab"
                            class="tab {activeEntityType === entityType ? 'tab-active' : ''} [--tab-bg:oklch(var(--b2))] [--tab-border-color:oklch(var(--b3))]"
                            onclick={() => activeEntityType = entityType}
                            aria-selected={activeEntityType === entityType}
                            disabled={count === 0}
                        >
                            {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
                            <span class="badge badge-sm badge-ghost ml-2">{count}</span>
                        </button>
                    {/each}
                </div>

                <!-- Content Display Area -->
                <div class="space-y-6">
                    {#if activeEntityType === 'tables' || activeEntityType === 'views'}
                        {#if currentEntityItems && Object.keys(currentEntityItems).length > 0}
                            {#each Object.entries(currentEntityItems) as [name, itemData]}
                                {@const typedItem = itemData as TableMetadata | ViewMetadata}
                                <div class="collapse collapse-arrow bg-base-100 shadow-md">
                                    <input type="checkbox" name="item-accordion-{activeSchema.name}-{name}" />
                                    <div class="collapse-title text-xl font-medium">
                                        {name}
                                        <span class="badge badge-ghost ml-2">{activeEntityType.slice(0, -1)}</span>
                                    </div>
                                    <div class="collapse-content">
                                        <RLMetadataTable
                                            title={name}
                                            itemType={activeEntityType.slice(0, -1) as 'table' | 'view'}
                                            columns={getColumnsForTableOrView(typedItem)}
                                        />
                                        <div class="mt-4 p-4 border border-dashed border-base-300 rounded-md">
                                            <RLApiInterface
                                                schemaName={activeSchema.name}
                                                resourceName={name}
                                                resourceType={activeEntityType.slice(0, -1) as 'table' | 'view'}
                                                columns={getColumnsForTableOrView(typedItem)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        {:else}
                            <p class="text-center p-4 text-neutral-content/70">No {activeEntityType} found in this schema.</p>
                        {/if}
                    {:else if activeEntityType === 'enums'}
                        {#if currentEntityItems && Object.keys(currentEntityItems).length > 0}
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {#each Object.entries(currentEntityItems) as [name, enumData]}
                                {@const typedItem = enumData as EnumMetadata}
                                <div class="card bg-base-100 shadow-md">
                                    <div class="card-body">
                                        <h4 class="card-title text-base">{name}</h4>
                                        <div class="flex flex-wrap gap-1 mt-2">
                                            {#each typedItem.values as value}
                                                <span class="badge badge-info badge-outline text-xs">{value}</span>
                                            {/each}
                                        </div>
                                    </div>
                                </div>
                            {/each}
                            </div>
                        {:else}
                            <p class="text-center p-4 text-neutral-content/70">No enums found in this schema.</p>
                        {/if}
                    {:else if activeEntityType === 'functions' || activeEntityType === 'procedures' || activeEntityType === 'triggers'}
                         {#if currentEntityItems && Object.keys(currentEntityItems).length > 0}
                            {#each Object.entries(currentEntityItems) as [name, funcData]}
                                {@const typedItem = funcData as FunctionMetadata}
                                <div class="card bg-base-100 shadow-md">
                                    <div class="card-body">
                                        <h4 class="card-title text-base">{name}
                                            <span class="badge badge-ghost badge-sm">{typedItem.objectType}</span>
                                        </h4>
                                        {#if typedItem.description}
                                            <p class="text-xs text-neutral-content/70 italic mt-1 mb-2">{typedItem.description}</p>
                                        {/if}
                                        {#if typedItem.parameters && typedItem.parameters.length > 0}
                                            <h5 class="font-semibold text-sm mt-2">Parameters:</h5>
                                            <div class="overflow-x-auto text-xs">
                                                <table class="table table-xs">
                                                    <thead>
                                                        <tr>
                                                            <th>Name</th>
                                                            <th>Type</th>
                                                            <th>Mode</th>
                                                            <th>Default?</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {#each typedItem.parameters as param}
                                                            <tr>
                                                                <td>{param.name}</td>
                                                                <td class="font-mono">{param.type}</td>
                                                                <td><span class="badge badge-neutral badge-outline badge-xs">{param.mode}</span></td>
                                                                <td>{param.hasDefault ? '✓' : '✗'}</td>
                                                            </tr>
                                                        {/each}
                                                    </tbody>
                                                </table>
                                            </div>
                                        {/if}
                                        {#if typedItem.returnType && typedItem.returnType !== 'void'}
                                            <div class="mt-2">
                                                <span class="font-semibold text-sm">Returns:</span>
                                                <span class="font-mono text-xs ml-2 badge badge-outline">{typedItem.returnType}</span>
                                            </div>
                                        {/if}
                                        <div class="mt-4 p-2 border border-dashed border-base-300 rounded-md">
                                            <p class="text-center text-xs text-neutral-content/70">
                                                RLApiInterface for function '{name}' (POST) will be here.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        {:else}
                            <p class="text-center p-4 text-neutral-content/70">No {activeEntityType} found in this schema.</p>
                        {/if}
                    {/if}
                </div>
            </div>
        {:else if !isLoading}
            <div role="alert" class="alert alert-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>Please select a valid schema to view its details, or the API might not be connected.</span>
            </div>
        {/if}
    {:else if !isLoading && (!schemas || schemas.length === 0)}
         <div role="alert" class="alert">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-info shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>No schemas found. Ensure the API is running and configured correctly.</span>
        </div>
    {/if}
</div>