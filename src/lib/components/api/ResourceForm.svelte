<!-- src/lib/components/api/APIResourceForm.svelte -->
<script lang="ts">
    import type { ColumnMetadata } from 'ts-forge';

    let { columns, onSubmit } = $props<{
        columns: ColumnMetadata[];
        onSubmit: (data: any) => Promise<void>;
    }>();

    let formData = $state<Record<string, any>>({});

    function handleSubmit() {
        onSubmit(formData);
    }
</script>

<form onsubmit={handleSubmit} class="space-y-4 mt-4">
    {#each columns as column}
        {#if !column.is_pk}  <!-- Skip primary key fields for POST/PUT -->
            <div class="form-control">
                <span class="label-text">{column.name}</span>
                {#if !column.nullable}*{/if}
                <input
                    type={column.type}
                    class="input input-bordered"
                    bind:value={formData[column.name]}
                    required={!column.nullable}
                    placeholder={column.type}
                />
            </div>
        {/if}
    {/each}

    <button 
        type="submit" 
        class="btn btn-primary"
    >Submit
    </button>
</form>