<!-- src/lib/components/forms/RLFilterForm.svelte -->
<script lang="ts">
    import type { ColumnMetadata } from '@yrrrrrf/prism-ts';
    import { mapSqlTypeToInputType } from '$lib/tools/form-helpers.js';

    let {
        columns,
        onSubmit,
        loading = false
    } = $props<{
        columns: ColumnMetadata[];
        onSubmit: (filters: {
            where?: Record<string, any>;
            limit?: number;
            offset?: number;
            orderBy?: string;
            orderDir?: 'asc' | 'desc';
        }) => void;
        loading?: boolean;
    }>();

    let where = $state<Record<string, any>>({});
    let limit = $state<number | undefined>(10);
    let offset = $state<number | undefined>(0);
    let orderBy = $state<string | undefined>(undefined);
    let orderDir = $state<'asc' | 'desc'>('asc');

    // Populate orderBy options
    let orderByOptions = $derived(columns.map((c: ColumnMetadata) => c.name));

    function handleFormSubmit(event: SubmitEvent) {
        event.preventDefault();
        const cleanedWhere: Record<string, any> = {};
        for (const key in where) {
            if (where[key] !== undefined && where[key] !== null && where[key] !== '') {
                // Basic type coercion for numbers if input type was number
                const column = columns.find((c: ColumnMetadata) => c.name === key);
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
            orderBy: orderBy || undefined, // Send undefined if empty string
            orderDir: orderDir
        });
    }
</script>

<form onsubmit={handleFormSubmit} class="space-y-6">
    <h4 class="text-lg font-semibold mb-2">Filters (Where Clause)</h4>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each columns as column}
            {@const inputType = mapSqlTypeToInputType(column.type)}
            <div class="form-control">
                <label class="label" for="filter-{column.name}">
                    <span class="label-text">{column.name}</span>
                </label>
                {#if inputType === 'checkbox'}
                     <select class="select select-bordered" bind:value={where[column.name]}>
                        <option value={undefined}>Any</option>
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