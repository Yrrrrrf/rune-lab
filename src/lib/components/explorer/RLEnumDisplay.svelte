<!-- src/lib/components/explorer/RLEnumDisplay.svelte -->
<script lang="ts">
    import type { RLEnumMetadata } from '$lib/components/stores/explorer.svelte';
    import RLMetadataList from '../dataview/RLMetadataList.svelte'; // Adjust path as needed

    let {
        enumData,
        // Optional: if RLEnumDisplay should have its own modal button.
        // Otherwise, RLSchemaExplorer can handle showing the modal if needed via context.
        // For simplicity, let's assume any modal action is handled by the parent (RLSchemaExplorer).
    } = $props<{
        enumData: RLEnumMetadata;
    }>();

    let enumValueItems = $derived(
        enumData.values.map((value: string) => ({
            name: value,
        }))
    );
</script>

<div class="py-2">
    <RLMetadataList items={enumValueItems} title="Values" emptyText="No values defined for this enum." />
    <!-- 
        If RLSchemaExplorer needs a way to open its existing enum modal from here,
        you could add a button and an on:click event that bubbles up or calls a prop function.
        Example:
        <div class="mt-2">
            <button class="btn btn-xs btn-outline" on:click>
                Show in Modal (if needed)
            </button>
        </div>
    -->
</div>