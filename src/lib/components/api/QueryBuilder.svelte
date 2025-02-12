<!-- src/lib/components/api/QueryBuilder.svelte -->
<script lang="ts">
    import type { ColumnMetadata } from 'ts-forge';

    let { columns, onSubmit } = $props<{
        columns: ColumnMetadata[];
        onSubmit: (filters: any) => Promise<void>;
    }>();

    let filters = $state<Record<string, any>>({});

    function handleSubmit() {
        onSubmit(filters);
    }
</script>

<form onsubmit={handleSubmit} class="space-y-4 mt-4">
    <div class="grid grid-cols-2 gap-4">
        {#each columns as column}
            <div class="form-control">
                <span class="label-text">{column.name}</span>
                <input
                    type={column.type}
                    class="input input-bordered"
                    bind:value={filters[column.name]}
                    placeholder={column.type}
                />
            </div>
        {/each}
    </div>

    <button type="submit" class="btn btn-primary">
        Search
    </button>
</form>