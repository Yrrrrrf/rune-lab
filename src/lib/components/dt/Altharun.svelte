<!-- Altharun (from Old Norse "aldir" = age, wisdom) -->
<!-- src/lib/components/data/Altharun.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { databaseStore } from 'rune-lab';

    onMount(async () => {
        await databaseStore.init();
    });
    
    // Debug the schemas whenever they change
    $effect(() => {
        console.log('Current schemas:', Object.keys(databaseStore.schemas));
        if (databaseStore.activeSchema) {
            console.log('Active schema tables:', 
                Object.keys(databaseStore.schemas[databaseStore.activeSchema]));
        }
    });
</script>

<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Database Management</h1>

    {#each Object.keys(databaseStore.schemas) as schemaName}
        {@const currentSchema = databaseStore.schemas[schemaName]}
        <div class="mb-6">
            <button
                class="w-full flex items-center justify-between p-4 bg-base-200 rounded-lg"
                onclick={() => databaseStore.toggleSchema(schemaName)}
            >
                <span class="text-xl font-semibold">{schemaName}</span>
                <span class="transform transition-transform duration-200" 
                      class:rotate-180={databaseStore.activeSchema === schemaName}>
                    ▼
                </span>
            </button>

            {#if databaseStore.activeSchema === schemaName && currentSchema}
                <div class="mt-4 space-y-2 pl-4">
                    {#each Object.keys(currentSchema) as tableName}
                        <div class="card bg-base-100 shadow-lg hover:shadow-xl transition-all">
                            <div class="card-body">
                                <div class="flex justify-between items-center mb-4">
                                    <h3 class="card-title text-xl">{tableName}</h3>
                                    <span class="badge badge-outline">{currentSchema[tableName].columns.length} columns</span>
                                </div>

                                <div class="overflow-x-auto">
                                    <table class="table table-sm w-full">
                                        <thead>
                                            <tr>
                                                <th>Column</th>
                                                <th>Type</th>
                                                <th class="text-center">Key</th>
                                                <th class="text-center">Required</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {#each currentSchema[tableName].columns as column}
                                                <tr class="hover">
                                                    <td class="font-mono">{column.name}</td>
                                                    <td class="text-sm opacity-75">{column.type}</td>
                                                    <td class="text-center">
                                                        {#if column.is_primary_key}
                                                            <span class="badge badge-primary badge-sm">PK</span>
                                                        {:else if column.is_foreign_key}
                                                            <span class="badge badge-secondary badge-sm">FK</span>
                                                        {/if}
                                                    </td>
                                                    <td class="text-center">
                                                        {#if column.is_primary_key || !column.nullable}
                                                            <span class="text-error">*</span>
                                                        {/if}
                                                    </td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>

                                <div class="card-actions justify-end mt-4">
                                    <button 
                                        class="btn btn-sm btn-primary"
                                        onclick={() => databaseStore.setActiveTable(schemaName, tableName)}
                                    >
                                        Manage Table
                                    </button>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/each}
</div>
