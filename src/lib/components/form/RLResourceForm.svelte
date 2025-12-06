<!-- src/lib/components/form/RLResourceForm.svelte -->
<script lang="ts">
    // Expecting PrismColumnMetadata directly now, or transform them before passing to this component
    import type { ColumnMetadata as PrismColumnMetadata } from '@yrrrrrf/prism-ts';
    import type { RLColumnMetadata, RLEnumMetadata } from '$lib/components/stores/explorer.svelte'; // For enumsInSchema
    import { apiStore } from '$lib/components/stores/api.svelte'; // For FK fetching if done here
    import {
        mapSqlTypeToInputType,
        getNumericInputAttributes, // Assuming you might want this here too
        getEnumMetadataForColumn,
        getDisplayFieldForFk
    } from '$lib/tools/form-helpers.js';
    import { onMount } from 'svelte'; // For FK fetching

    type FKOption = { value: string | number; label: string };

    let {
        columns, // Expecting PrismColumnMetadata[]
        initialData = {},
        operation,
        onSubmit,
        loading = false,
        enumsInSchema = {},         // <<< ADD THIS PROP
        currentResourceName = ""    // <<< ADD THIS PROP
    } = $props<{
        columns: PrismColumnMetadata[]; // Explicitly PrismColumnMetadata
        initialData?: Record<string, any>;
        operation: 'POST' | 'PUT';
        onSubmit: (formData: Record<string, any>) => void;
        loading?: boolean;
        enumsInSchema?: Record<string, RLEnumMetadata>; // <<< ADD TYPE FOR PROP
        currentResourceName?: string;                   // <<< ADD TYPE FOR PROP (make optional if sometimes not needed, but likely always needed if columns are present)
    }>();

    let formData = $state<Record<string, any>>({});
    let fkOptions = $state<Record<string, FKOption[]>>({});
    let fkLoading = $state<Record<string, boolean>>({});

    async function fetchFkDataResourceForm(column: PrismColumnMetadata) {
        if (!column.references || fkOptions[column.name] || fkLoading[column.name]) return;

        fkLoading[column.name] = true;
        try {
            const ref = column.references;
            if (!apiStore.prism) {
                console.error("Prism client not available for FK fetch in ResourceForm");
                fkOptions[column.name] = [];
                return;
            }
            const ops = await apiStore.prism.getTableOperations(ref.schema, ref.table);
            const referencedTableMetadata = await apiStore.prism.getTable(ref.schema, ref.table);

            if (!referencedTableMetadata) {
                 console.error(`Could not fetch metadata for referenced table ${ref.schema}.${ref.table}`);
                 fkOptions[column.name] = [];
                 return;
            }

            const tempMapPrismColToRLCol = (pCol: any): any /*RLColumnMetadata*/ => ({ // Use any for temp, or full RLColumnMetadata
                name: pCol.name, type: pCol.type, nullable: pCol.nullable,
                isPrimaryKey: pCol.is_pk === true, isEnum: pCol.is_enum === true, references: undefined
            });
            const referencedRLColumns = referencedTableMetadata.columns.map(tempMapPrismColToRLCol);
            const displayField = getDisplayFieldForFk(referencedRLColumns);

            const data = await ops.findAll({ limit: 100, orderBy: displayField });

            fkOptions[column.name] = data.map((item: any) => ({
                value: item[ref.column],
                label: `${item[displayField]} (ID: ${item[ref.column]})`
            }));
        } catch (err) {
            console.error(`Failed to fetch FK options for ${column.name} in ResourceForm:`, err);
            fkOptions[column.name] = [];
        } finally {
            fkLoading[column.name] = false;
        }
    }


    $effect(() => {
        const newFormData: Record<string, any> = {};
        for (const column of columns) {
            if (initialData && initialData[column.name] !== undefined) {
                 if (mapSqlTypeToInputType(column.type, column.name) === 'checkbox') {
                    newFormData[column.name] = Boolean(initialData[column.name]);
                } else if (mapSqlTypeToInputType(column.type, column.name) === 'datetime-local' && initialData[column.name]) {
                    try {
                        newFormData[column.name] = new Date(initialData[column.name]).toISOString().slice(0, 16);
                    } catch (e) { newFormData[column.name] = ''; }
                }
                else {
                    newFormData[column.name] = initialData[column.name];
                }
            } else {
                if (mapSqlTypeToInputType(column.type, column.name) === 'checkbox') {
                    newFormData[column.name] = false; // Default for checkbox
                } else if (column.references) {
                    newFormData[column.name] = ""; // Default to empty string for FK selects to show placeholder
                } else {
                    // For other types, you might want specific defaults or leave them undefined
                    // For example, numbers could default to 0 or '', strings to ''
                    // This behavior might need more refinement based on desired UX
                }
            }
        }
        formData = newFormData;

        // Fetch FK data when columns or initialData changes (and on mount effectively)
        columns.forEach((col: RLColumnMetadata) => {
            if (col.references) {
                fetchFkDataResourceForm(col);
            }
        });
    });


    function getStepForNumberInput(sqlType: string): string | undefined {
        const lowerSqlType = sqlType.toLowerCase();
        if (lowerSqlType.includes('decimal') || lowerSqlType.includes('numeric') || lowerSqlType.includes('real') || lowerSqlType.includes('double')) {
            return 'any';
        }
        return undefined;
    }

    function handleFormSubmit(event: SubmitEvent) {
        event.preventDefault();
        const processedFormData: Record<string, any> = {};
        for (const column of columns) {
            const key = column.name;
            let value = formData[key];
            const inputType = mapSqlTypeToInputType(column.type, column.name);

            // Handle empty string from select as null if column is nullable
            if (value === "" && column.nullable && (column.references || getEnumMetadataForColumn(column as any, enumsInSchema, currentResourceName))) {
                value = null;
            }

            if (value !== undefined && value !== null && value !== '') { // Check for empty string too, unless it's a valid empty string field
                if (inputType === 'number') {
                    value = Number(value);
                } else if (inputType === 'checkbox') {
                    value = Boolean(value);
                } else if (inputType === 'datetime-local' && value) {
                     try { value = new Date(value).toISOString(); } catch (e) { /* handle error */ }
                } else if (column.type.toLowerCase().includes('json') && typeof value === 'string') {
                    try { value = JSON.parse(value); } catch (e) { console.warn(`Invalid JSON for ${key}: ${value}`); }
                }
            } else if (inputType === 'checkbox') { // Ensure boolean false is sent for unchecked boxes
                value = false;
            } else if (column.nullable && (value === '' || value === undefined)) { // Send null for empty nullable fields
                value = null;
            }


            // Only include the field if it has a value, is a boolean, or is explicitly set to null.
            // And for PUT, even if unchanged but present in initialData, it might need to be sent.
            // For POST, only send fields that have values or are booleans.
            // This logic might need refinement based on how your API handles partial updates vs. full replacements for PUT.
            if (value !== undefined || (inputType === 'checkbox')) {
                 processedFormData[key] = value;
            }
        }
        onSubmit(processedFormData);
    }
</script>

<form onsubmit={handleFormSubmit} class="space-y-4">
    {#each columns as column}
        {@const inputType = mapSqlTypeToInputType(column.type, column.name)}
        {@const isPK = column.is_pk}
        {@const isDisabled = (operation === 'PUT' && isPK) || (operation === 'POST' && isPK && column.type.toLowerCase().includes('serial'))}
        {@const numericAttrs = inputType === 'number' ? getNumericInputAttributes(column.type) : {}}
        {@const enumMeta = getEnumMetadataForColumn(column, enumsInSchema, currentResourceName)}

        {#if !(operation === 'POST' && isPK && column.type.toLowerCase().includes('serial'))}
            <div class="form-control w-full">
                <label class="label" for="field-{column.name}">
                    <span class="label-text font-medium">{column.name}
                        {#if !column.nullable && inputType !== 'checkbox' && !enumMeta && !column.references}<span class="text-error">*</span>{/if}
                        {#if isPK}<span class="badge badge-accent badge-xs ml-2">PK</span>{/if}
                    </span>
                </label>

                {#if enumMeta}
                    <select class="select select-bordered w-full" bind:value={formData[column.name]} id="field-{column.name}" required={!column.nullable} disabled={isDisabled}>
                        {#if column.nullable}
                            <option value="">-- Select {column.name} (Optional) --</option>
                        {:else}
                            <option value="" disabled selected>-- Select {column.name} --</option>
                        {/if}
                        {#each enumMeta.values as enumValue}
                            <option value={enumValue}>{enumValue}</option>
                        {/each}
                    </select>
                {:else if column.references && fkOptions[column.name]}
                    <select class="select select-bordered w-full" bind:value={formData[column.name]} id="field-{column.name}" required={!column.nullable} disabled={isDisabled || fkLoading[column.name]}>
                        {#if column.nullable}
                            <option value="">-- Select {column.name} (Optional) --</option>
                        {:else}
                            <option value="" disabled selected>-- Select {column.name} --</option>
                        {/if}
                        {#if fkLoading[column.name]}
                            <option disabled>Loading options...</option>
                        {/if}
                        {#each fkOptions[column.name] as option}
                            <option value={option.value}>{option.label}</option>
                        {/each}
                        {#if !fkLoading[column.name] && (!fkOptions[column.name] || fkOptions[column.name].length === 0)}
                             <option disabled value="">No options available</option>
                        {/if}
                    </select>
                {:else if inputType === 'textarea'}
                    <textarea
                        id="field-{column.name}"
                        class="textarea textarea-bordered h-24"
                        bind:value={formData[column.name]}
                        required={!column.nullable && !isDisabled}
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
                        required={!column.nullable && !isDisabled}
                        placeholder="Enter {column.name} ({column.type})"
                        disabled={isDisabled}
                        step={numericAttrs.step ?? getStepForNumberInput(column.type)}
                        min={numericAttrs.min}
                        max={numericAttrs.max}
                    />
                {/if}
                {#if column.references && !fkOptions[column.name] /* Only show if not already a select */}
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
            {operation === 'POST' ? 'Create' : 'Update'} Resource
        </button>
    </div>
</form>