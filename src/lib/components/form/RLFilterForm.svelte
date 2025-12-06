<!-- src/lib/components/form/RLFilterForm.svelte -->
<script lang="ts">
    // Use RLColumnMetadata from your project's explorer store types
    import type { RLColumnMetadata, RLColumnReference, RLEnumMetadata } from '$lib/components/stores/explorer.svelte';
    import { apiStore } from '$lib/components/stores/api.svelte';
    import {
        mapSqlTypeToInputType,
        getNumericInputAttributes,
        getEnumMetadataForColumn,
        getDisplayFieldForFk
    } from '$lib/tools/form-helpers.js';
    import { onMount } from 'svelte';

    type FKOption = { value: string | number; label: string };

    let {
        columns,
        onSubmit,
        loading = false,
        enumsInSchema = {},
        currentResourceName // Name of the table/view this form is for
    } = $props<{
        columns: RLColumnMetadata[];
        onSubmit: (filters: {
            where?: Record<string, any>;
            limit?: number;
            offset?: number;
            orderBy?: string;
            orderDir?: 'asc' | 'desc';
        }) => void;
        loading?: boolean;
        enumsInSchema?: Record<string, RLEnumMetadata>;
        currentResourceName: string;
    }>();

    let where = $state<Record<string, any>>({});
    let limit = $state<number | undefined>(10);
    let offset = $state<number | undefined>(0);
    let orderBy = $state<string | undefined>(undefined);
    let orderDir = $state<'asc' | 'desc'>('asc');

    let fkOptions = $state<Record<string, FKOption[]>>({});
    let fkLoading = $state<Record<string, boolean>>({});

    // Populate orderBy options
    let orderByOptions = $derived(columns.map((c: RLColumnMetadata) => c.name));

    async function fetchFkData(column: RLColumnMetadata) {
        if (!column.references || fkOptions[column.name] || fkLoading[column.name]) return;

        fkLoading[column.name] = true;
        try {
            const ref = column.references;
            if (!apiStore.prism) {
                console.error("Prism client not available for FK fetch");
                fkOptions[column.name] = [];
                return;
            }
            const ops = await apiStore.prism.getTableOperations(ref.schema, ref.table);
            
            // Fetch referenced table's columns to determine display field
            const referencedTableMetadata = await apiStore.prism.getTable(ref.schema, ref.table);
            if (!referencedTableMetadata) {
                 console.error(`Could not fetch metadata for referenced table ${ref.schema}.${ref.table}`);
                 fkOptions[column.name] = [];
                 return;
            }
            // Transform prism-ts ColumnMetadata to RLColumnMetadata for getDisplayFieldForFk if necessary,
            // or adapt getDisplayFieldForFk to take PrismColumnMetadata.
            // For now, let's assume referencedTableMetadata.columns matches what getDisplayFieldForFk expects
            // OR that getDisplayFieldForFk is adapted.
            // If apiStore.prism.getTable returns PrismTableMetadata, its columns are PrismColumnMetadata.
            // Let's assume getDisplayFieldForFk can handle PrismColumnMetadata (which is similar to RLColumnMetadata)
            // or we would need a mini-transformer here.
            // For simplicity, we'll assume PrismColumnMetadata has name, type, isPrimaryKey fields.

            // This is a simplified approach. `getDisplayFieldForFk` ideally needs the `RLColumnMetadata` structure
            // or to be adapted to work with `PrismColumnMetadata`. Let's make a temporary adapter.
            const tempMapPrismColToRLCol = (pCol: any): RLColumnMetadata => ({
                name: pCol.name, type: pCol.type, nullable: pCol.nullable,
                isPrimaryKey: pCol.is_pk === true, isEnum: pCol.is_enum === true, references: undefined
            });

            const referencedRLColumns = referencedTableMetadata.columns.map(tempMapPrismColToRLCol);
            const displayField = getDisplayFieldForFk(referencedRLColumns);

            const data = await ops.findAll({ limit: 100, orderBy: displayField }); // Limit for dropdown; consider searchable component for more

            fkOptions[column.name] = data.map((item: any) => ({
                value: item[ref.column], // The actual FK value (ID of referenced record)
                label: `${item[displayField]} (ID: ${item[ref.column]})` // Human-readable label
            }));
        } catch (err) {
            console.error(`Failed to fetch FK options for ${column.name}:`, err);
            fkOptions[column.name] = []; // Set empty on error to prevent repeated attempts
        } finally {
            fkLoading[column.name] = false;
        }
    }

    onMount(() => {
        columns.forEach((col: RLColumnMetadata) => {
            if (col.references) {
                fetchFkData(col);
            }
        });
    });


    function handleFormSubmit(event: SubmitEvent) {
        event.preventDefault();
        const cleanedWhere: Record<string, any> = {};
        for (const key in where) {
            if (where[key] !== undefined && where[key] !== null && where[key] !== '' && where[key] !== "ANY_ENUM_VALUE" && where[key] !== "ANY_FK_VALUE") {
                const column = columns.find((c: RLColumnMetadata) => c.name === key);
                if (column && mapSqlTypeToInputType(column.type) === 'number') {
                    cleanedWhere[key] = Number(where[key]);
                } else {
                    cleanedWhere[key] = where[key];
                }
            }
        }
        onSubmit({
            where: Object.keys(cleanedWhere).length > 0 ? cleanedWhere : undefined,
            limit: limit,
            offset: offset,
            orderBy: orderBy || undefined,
            orderDir: orderDir
        });
    }
</script>

<form onsubmit={handleFormSubmit} class="space-y-6">
    <h4 class="text-lg font-semibold mb-2">Filters (Where Clause)</h4>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each columns as column}
            {@const inputType = mapSqlTypeToInputType(column.type, column.name)}
            {@const numericAttrs = inputType === 'number' ? getNumericInputAttributes(column.type) : {}}
            {@const enumMeta = getEnumMetadataForColumn(column, enumsInSchema, currentResourceName)}

            <div class="form-control">
                <label class="label" for="filter-{column.name}">
                    <span class="label-text">{column.name}</span>
                </label>

                {#if enumMeta}
                    <select class="select select-bordered" bind:value={where[column.name]} id="filter-{column.name}">
                        <option value="ANY_ENUM_VALUE">Any {column.name}</option>
                        {#each enumMeta.values as enumValue}
                            <option value={enumValue}>{enumValue}</option>
                        {/each}
                    </select>
                {:else if column.references && fkOptions[column.name]}
                    <select class="select select-bordered" bind:value={where[column.name]} id="filter-{column.name}" disabled={fkLoading[column.name]}>
                        <option value="ANY_FK_VALUE">Any {column.name}</option>
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
                {:else if inputType === 'checkbox'}
                     <select class="select select-bordered" bind:value={where[column.name]} id="filter-{column.name}">
                        <option value={undefined}>Any</option> <!-- Or a specific "ANY" string if undefined is problematic -->
                        <option value={true}>True</option>
                        <option value={false}>False</option>
                    </select>
                {:else}
                    <input
                        type={inputType}
                        id="filter-{column.name}"
                        class="input input-bordered"
                        bind:value={where[column.name]}
                        placeholder="Filter by {column.name}"
                        step={numericAttrs.step}
                        min={numericAttrs.min}
                        max={numericAttrs.max}
                    />
                {/if}
            </div>
        {/each}
    </div>

    <h4 class="text-lg font-semibold mb-2 mt-6">Pagination & Sorting</h4>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-control">
            <label class="label" for="filter-limit"><span class="label-text">Limit</span></label>
            <input type="number" id="filter-limit" class="input input-bordered" bind:value={limit} placeholder="10" min="1" />
        </div>
        <div class="form-control">
            <label class="label" for="filter-offset"><span class="label-text">Offset</span></label>
            <input type="number" id="filter-offset" class="input input-bordered" bind:value={offset} placeholder="0" min="0" />
        </div>
        <div class="form-control">
            <label class="label" for="filter-orderBy"><span class="label-text">Order By</span></label>
            <select id="filter-orderBy" class="select select-bordered" bind:value={orderBy}>
                <option value={undefined}>None</option>
                {#each orderByOptions as colName}
                    <option value={colName}>{colName}</option>
                {/each}
            </select>
        </div>
        <div class="form-control">
            <label class="label" for="filter-orderDir"><span class="label-text">Order Direction</span></label>
            <select id="filter-orderDir" class="select select-bordered" bind:value={orderDir} disabled={!orderBy}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
            </select>
        </div>
    </div>

    <div class="modal-action mt-6">
        <button type="submit" class="btn btn-primary" disabled={loading}>
            {#if loading}
                <span class="loading loading-spinner loading-xs"></span>
            {/if}
            Search
        </button>
    </div>
</form>