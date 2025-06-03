<!-- src/lib/components/forms/RLResourceForm.svelte -->
<script lang="ts">
    import type { ColumnMetadata } from '@yrrrrrf/prism-ts';
    import { mapSqlTypeToInputType } from '$lib/tools/form-helpers.js';


    let {
        columns,
        initialData = {}, // For PUT: prefill form
        operation, // 'POST' | 'PUT'
        onSubmit,
        loading = false
    } = $props<{
        columns: ColumnMetadata[];
        initialData?: Record<string, any>;
        operation: 'POST' | 'PUT';
        onSubmit: (formData: Record<string, any>) => void;
        loading?: boolean;
    }>();

    // Deep copy initialData to formData to avoid mutating prop and allow local edits
    let formData = $state<Record<string, any>>({});

    $effect(() => {
        // Initialize or reset formData when initialData or columns change
        const newFormData: Record<string, any> = {};
        for (const column of columns) {
            // For PUT, prefill with initialData. For POST, use default based on type or leave empty.
            if (initialData && initialData[column.name] !== undefined) {
                if (mapSqlTypeToInputType(column.type, column.name) === 'checkbox') {
                    newFormData[column.name] = Boolean(initialData[column.name]);
                } else if (mapSqlTypeToInputType(column.type, column.name) === 'datetime-local' && initialData[column.name]) {
                    // Ensure datetime-local format (YYYY-MM-DDTHH:mm)
                    try {
                        newFormData[column.name] = new Date(initialData[column.name]).toISOString().slice(0, 16);
                    } catch (e) { newFormData[column.name] = ''; }
                }
                else {
                    newFormData[column.name] = initialData[column.name];
                }
            } else {
                // Default for checkboxes if not in initialData
                if (mapSqlTypeToInputType(column.type, column.name) === 'checkbox') {
                    newFormData[column.name] = false;
                }
            }
        }
        formData = newFormData;
    });


    function getStepForNumberInput(sqlType: string): string | undefined {
        const lowerSqlType = sqlType.toLowerCase();
        if (lowerSqlType.includes('decimal') || lowerSqlType.includes('numeric') || lowerSqlType.includes('real') || lowerSqlType.includes('double')) {
            return 'any'; // Allows floating point numbers
        }
        return undefined; // Default step (usually 1 for integers)
    }

    function handleFormSubmit(event: SubmitEvent) {
        event.preventDefault();
        const processedFormData: Record<string, any> = {};
        for (const column of columns) {
            const key = column.name;
            let value = formData[key];

            // Type coercion based on input type
            const inputType = mapSqlTypeToInputType(column.type, column.name);
            if (value !== undefined && value !== null && value !== '') {
                if (inputType === 'number') {
                    value = Number(value);
                } else if (inputType === 'checkbox') {
                    value = Boolean(value);
                }
                // For datetime-local, ensure it's sent as ISO string if not null
                else if (inputType === 'datetime-local' && value) {
                     try {
                        value = new Date(value).toISOString();
                    } catch (e) { /* handle invalid date string if necessary */ }
                }
                // JSON fields might need JSON.parse if edited as text
                else if (column.type.toLowerCase().includes('json') && typeof value === 'string') {
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        // If parsing fails, could set an error or send as string
                        console.warn(`Invalid JSON for ${key}: ${value}`);
                    }
                }
            }
            // Only include the field if it has a value or if it's a boolean (checkbox)
            // or if it's explicitly set to null (e.g. clearing an optional field)
             if (value !== undefined || inputType === 'checkbox') {
                processedFormData[key] = value;
            }
        }
        onSubmit(processedFormData);
    }
</script>

<form onsubmit={handleFormSubmit} class="space-y-4">
    {#each columns as column}
        {@const inputType = mapSqlTypeToInputType(column.type, column.name)}
        {@const isPK = column.isPrimaryKey}
        {@const isDisabled = (operation === 'PUT' && isPK) || (operation === 'POST' && isPK && column.type.toLowerCase().includes('serial'))} <!-- Disable PK on PUT, and serial PKs on POST -->

        {#if !(operation === 'POST' && isPK && column.type.toLowerCase().includes('serial'))} <!-- Don't show auto-increment PK for POST -->
            <div class="form-control w-full">
                <label class="label" for="field-{column.name}">
                    <span class="label-text font-medium">{column.name}
                        {#if !column.nullable && inputType !== 'checkbox'}<span class="text-error">*</span>{/if}
                        {#if isPK}<span class="badge badge-accent badge-xs ml-2">PK</span>{/if}
                    </span>
                </label>

                {#if inputType === 'textarea'}
                    <textarea
                        id="field-{column.name}"
                        class="textarea textarea-bordered h-24"
                        bind:value={formData[column.name]}
                        required={!column.nullable}
                        placeholder="Enter {column.name}"
                        disabled={isDisabled}
                    ></textarea>
                {:else if inputType === 'checkbox'}
                    <input
                        type="checkbox"
                        id="field-{column.name}"
                        class="checkbox checkbox-primary"
                        bind:checked={formData[column.name]}
                        disabled={isDisabled}
                    />
                {:else}
                    <input
                        type={inputType}
                        id="field-{column.name}"
                        class="input input-bordered w-full"
                        bind:value={formData[column.name]}
                        required={!column.nullable}
                        placeholder="Enter {column.name} ({column.type})"
                        disabled={isDisabled}
                        step={getStepForNumberInput(column.type)}
                    />
                {/if}
                {#if column.references}
                    <div class="label">
                        <span class="label-text-alt text-xs text-neutral-content/60">
                            FK to {column.references.schema}.{column.references.table}.{column.references.column}
                        </span>
                    </div>
                {/if}
            </div>
        {/if}
    {/each}

    <div class="modal-action mt-6">
        <button type="submit" class="btn btn-primary" disabled={loading}>
            {#if loading}
                <span class="loading loading-spinner loading-xs"></span>
            {/if}
            {operation === 'POST' ? 'Create' : 'Update'} {name}
        </button>
    </div>
</form>