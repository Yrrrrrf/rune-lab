<!-- src/lib/components/dt/Altharun.svelte -->
<script lang="ts">
    import type { SchemaMetadata } from 'ts-forge';
    import { forge } from '$lib/forge.svelte.js';
    import SchemaDisplay from './SchemaDisplay.svelte';

    // State management with runes
    let schemas = $state<SchemaMetadata[]>([]);
    let activeSchema = $state<string | null>(null);
    let isLoading = $state(true);
    let error = $state<string | null>(null);

    // Derived value for active schema data
    let activeSchemaData = $derived(
        activeSchema && schemas.length ? 
            schemas.find(s => s.name === activeSchema) || null 
            : null
    );

    // Initialize and load schemas
    async function initializeForge() {
        try {
            isLoading = true;
            error = null;
            await forge.initialize();
            schemas = forge.schemaMetadata;
            // Set first schema as active by default if available
            if (schemas.length > 0 && !activeSchema) {
                activeSchema = schemas[0].name;
            }
            isLoading = false;
        } catch (e) {
            error = e instanceof Error ? e.message : 'Failed to load schemas';
            isLoading = false;
        }
    }

    // Run initialization
    $effect(() => {
        initializeForge();
    });
</script>

<div class="container mx-auto p-4">
    {#if isLoading}
        <div class="flex justify-center items-center h-32">
            <span class="loading loading-spinner loading-lg"></span>
        </div>
    {:else if error}
        <div class="alert alert-error">
            <span>{error}</span>
        </div>
    {:else}
        <!-- Schema Selection -->
        <div class="tabs tabs-boxed mb-6">
            {#each schemas as schema}
                <button 
                    class="tab {activeSchema === schema.name ? 'tab-active' : ''}"
                    onclick={() => activeSchema = schema.name}
                >
                    {schema.name}
                </button>
            {/each}
        </div>

        {#if activeSchemaData}
            <SchemaDisplay schema={activeSchemaData} />
        {:else}
            <div class="alert alert-info">
                <span>Please select a schema to view its details</span>
            </div>
        {/if}
    {/if}
</div>