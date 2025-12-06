<!-- src/lib/components/forms/RLFunctionForm.svelte -->
<script lang="ts">
    import type { FunctionParameter } from '@yrrrrrf/prism-ts';
    import { mapSqlTypeToInputType } from '$lib/tools/form-helpers.js';
    

    let {
        params, // FunctionParameter[]
        onSubmit,
        loading = false
    } = $props<{
        params: FunctionParameter[];
        onSubmit: (paramValues: Record<string, any>) => void;
        loading?: boolean;
    }>();

    let paramValues = $state<Record<string, any>>({});

    // Initialize paramValues based on params (e.g., for default values if any, or types)
    $effect(() => {
        const initialValues: Record<string, any> = {};
        for (const param of params) {
            if (mapSqlTypeToInputType(param.type) === 'checkbox') {
                initialValues[param.name] = param.defaultValue === 'true' || false; // Or handle default better
            } else {
                initialValues[param.name] = param.defaultValue ?? ''; // Or type-specific default
            }
        }
        paramValues = initialValues;
    });


    function handleFormSubmit(event: SubmitEvent) {
        event.preventDefault();
        // Add any necessary type coercion for function parameters before submitting
        const processedParams: Record<string, any> = {};
        for (const param of params) {
            let value = paramValues[param.name];
            if (value !== undefined && value !== null && value !== '') {
                if (mapSqlTypeToInputType(param.type) === 'number') {
                    value = Number(value);
                } else if (mapSqlTypeToInputType(param.type) === 'checkbox') {
                    value = Boolean(value);
                } else if (param.type.toLowerCase().includes('json') && typeof value === 'string') {
                     try { value = JSON.parse(value); } catch (e) { console.warn("Invalid JSON for param", param.name); }
                }
            }
            processedParams[param.name] = value;
        }
        onSubmit(processedParams);
    }
</script>

<form onsubmit={handleFormSubmit} class="space-y-4">
    {#if params.length === 0}
        <p class="text-neutral-content/70">This function requires no parameters.</p>
    {/if}
    {#each params as param}
        {@const inputType = mapSqlTypeToInputType(param.type)}
        <div class="form-control w-full">
            <label class="label" for="param-{param.name}">
                <span class="label-text font-medium">{param.name} <span class="badge badge-ghost badge-xs font-mono">{param.type}</span>
                    {#if !param.hasDefault && inputType !== 'checkbox'}<span class="text-error">*</span>{/if}
                </span>
                {#if param.mode !== 'IN'} <span class="label-text-alt badge badge-outline badge-sm">{param.mode}</span> {/if}
            </label>

            {#if inputType === 'textarea'}
                <textarea id="param-{param.name}" class="textarea textarea-bordered h-24" bind:value={paramValues[param.name]} required={!param.hasDefault}></textarea>
            {:else if inputType === 'checkbox'}
                <input type="checkbox" id="param-{param.name}" class="checkbox checkbox-primary" bind:checked={paramValues[param.name]} />
            {:else}
                <input type={inputType} id="param-{param.name}" class="input input-bordered w-full" bind:value={paramValues[param.name]} required={!param.hasDefault} placeholder={param.defaultValue ? `Default: ${param.defaultValue}` : param.type} />
            {/if}
        </div>
    {/each}

    <div class="modal-action mt-6">
        <button type="submit" class="btn btn-primary" disabled={loading}>
            {#if loading} <span class="loading loading-spinner loading-xs"></span> {/if}
            Execute Function
        </button>
    </div>
</form>