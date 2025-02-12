<!-- src/lib/components/dt/SchemaDisplay.svelte -->
<script lang="ts">
    import type {
        SchemaMetadata,
        TableMetadata,
        ViewMetadata,
        SimpleEnumInfo,
        FunctionMetadataResponse,
        ColumnMetadata,
    } from 'ts-forge';
    import MetadataTable from './MetadataTable.svelte';
    import ApiInterface from '../api/ApiInterface.svelte';

    // Props
    let { schema } = $props<{
        schema: SchemaMetadata;
    }>();

    let activeView =  $state<'tables' | 'views' | 'enums' | 'functions' | 'procedures' | 'triggers'>('tables'); 

    // Helper functions
    function getContent(type: typeof activeView): Record<string, any> {
        if (!schema || !schema[type]) return {};
        return schema[type];
    }

    function getRecordCount(type: string): number {
        if (!schema || !schema[type]) return 0;
        return Object.keys(schema[type] || {}).length;
    }

    function safeEntries(obj: Record<string, any> | undefined | null): [string, any][] {
        if (!obj) return [];
        return Object.entries(obj);
    }

    function getColumns(content: TableMetadata | ViewMetadata): (ColumnMetadata)[] {
        if (!content) return [];
        
        // Handle table metadata
        if ('columns' in content && Array.isArray(content.columns)) {
            return content.columns;
        }
        
        // Handle view metadata
        if ('view_columns' in content && Array.isArray(content.view_columns)) {
            return content.view_columns.map((vc: any) => ({
                ...vc,
                isPrimaryKey: false,
                isEnum: false
            }));
        }
        
        return [];
    }

    // Type guards
    function isTableMetadata(data: unknown): data is TableMetadata {
        return !!data && typeof data === 'object' && 'columns' in data;
    }

    function isViewMetadata(data: unknown): data is ViewMetadata {
        return !!data && typeof data === 'object' && 'view_columns' in data;
    }

    function isEnumInfo(data: unknown): data is SimpleEnumInfo {
        return !!data && typeof data === 'object' && 'values' in data;
    }

    function isFunctionMetadata(data: unknown): data is FunctionMetadataResponse {
        return !!data && typeof data === 'object' && 'parameters' in data;
    }
</script>

<!-- View Type Selection -->
<div class="tabs tabs-bordered mb-6">
    {#each ['tables', 'views', 'enums', 'functions', 'procedures', 'triggers'] as type}
        {@const count = getRecordCount(type)}
        <button 
            class="tab {activeView === type ? 'tab-active' : ''}"
            onclick={() => activeView = type as typeof activeView}
        >
            {type} ({count})
        </button>
    {/each}
</div>

<div class="grid gap-4">
    {#if activeView === 'tables' || activeView === 'views'}
        {#each safeEntries(getContent(activeView)) as [name, content]}
            {#if isTableMetadata(content) || isViewMetadata(content)}

                <MetadataTable
                    title={name}
                    type={activeView}
                    columns={getColumns(content)}
                />

                API Interface ( {name} )
                <ApiInterface
                    resource={{
                        type: activeView.slice(0, -1) as 'table' | 'view',
                        schema: schema.name,
                        name,
                    }}
                    columns={getColumns(content)}
                />
            {/if}
        
        {/each}
    {:else if activeView === 'enums'}
        {#each safeEntries(getContent('enums')) as [name, enumInfo]}
            {#if isEnumInfo(enumInfo)}
                <div class="card bg-base-100 shadow-xl">
                    <div class="card-body">
                        <h3 class="card-title">{name}</h3>
                        <div class="flex flex-wrap gap-2">
                            {#each enumInfo.values as value}
                                <span class="badge badge-primary">{value}</span>
                            {/each}
                        </div>
                    </div>
                </div>
            {/if}
        {/each}
    {:else}
        {#each safeEntries(getContent(activeView)) as [name, func]}
            {#if isFunctionMetadata(func)}
                <div class="card bg-base-100 shadow-xl">
                    <div class="card-body">
                        <h3 class="card-title">{name}</h3>
                        <div class="overflow-x-auto">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Parameter</th>
                                        <th>Type</th>
                                        <th>Mode</th>
                                        <th>Default</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each func.parameters as param}
                                        <tr class="hover">
                                            <td>{param.name}</td>
                                            <td class="font-mono text-sm">{param.type}</td>
                                            <td>{param.mode}</td>
                                            <td>{param.has_default ? param.default_value || 'default' : ''}</td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                            {#if func.return_type}
                                <div class="mt-4">
                                    <span class="font-semibold">Returns:</span>
                                    <span class="font-mono ml-2">{func.return_type}</span>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            {/if}
        {/each}
    {/if}
</div>
