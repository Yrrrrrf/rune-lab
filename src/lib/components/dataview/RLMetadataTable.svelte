<!-- src/lib/components/dataview/RLMetadataTable.svelte -->
<script lang="ts">
    import type { ColumnMetadata, ColumnReference, EnumMetadata } from '@yrrrrrf/prism-ts';
        import { formatReferenceText } from '$lib/tools/form-helpers.js';

    let {
        title,
        itemType,
        columns,
        enumsInSchema = {},
        onFkClick, // Callback prop
        onEnumClick, // Callback prop
    } = $props<{
        title: string;
        itemType: 'table' | 'view';
        columns: ColumnMetadata[];
        enumsInSchema?: Record<string, EnumMetadata>;
        onFkClick?: (ref: ColumnReference) => void; // Make optional if not always needed
        onEnumClick?: (enumData: { name: string; values: string[] }) => void; // Make optional
    }>();


    function handleFkButtonClick(ref: ColumnReference | undefined) {
        if (ref && onFkClick) {
            onFkClick(ref);
        }
    }

    function getEnumForColumn(column: ColumnMetadata): EnumMetadata | undefined {
        if (!column.is_enum || !enumsInSchema || Object.keys(enumsInSchema).length === 0) {
            return undefined;
        }
        
        // Heuristic:
        // 1. Exact match: column.name === enumMeta.name
        // 2. Suffix match: enumMeta.name === `${column.name}_enum` (e.g., "status" -> "status_enum")
        // 3. Prefix match: enumMeta.name === `${itemType}_${column.name}` (e.g., "enrollment_status" for table "enrollment", col "status")
        // 4. More general: enumMeta.name includes column.name and "_enum" (e.g. "enrollment_status_enum" for "status")
        // The prism-py output for enrollment.status shows "Enum(enrollment_status)".
        // The actual enum name from `dt-schemas.json` (API response) for student schema is `status_enum`.
        // If `column.name` is 'status' and `isEnum` is true, we need to find `status_enum`.

        const colNameLower = column.name.toLowerCase();
        for (const enumKey in enumsInSchema) {
            const enumMeta = enumsInSchema[enumKey];
            const enumNameLower = enumMeta.name.toLowerCase();

            if (enumNameLower === colNameLower) return enumMeta; // Exact name match
            if (enumNameLower === `${colNameLower}_enum`) return enumMeta; // status -> status_enum
            if (enumNameLower === `${title.toLowerCase()}_${colNameLower}`) return enumMeta; // enrollment_status for table enrollment, column status
            // Check if the enum name is specifically related to the column, common pattern is `table_column_enum` or `column_enum`
             if (enumNameLower.includes(colNameLower) && enumNameLower.endsWith("_enum")) return enumMeta;


        }
        // If after specific checks nothing, try to find any enum that might be related by column name part
        // This is very broad, use with caution or remove if too many false positives.
        // for (const enumKey in enumsInSchema) {
        //     if (enumsInSchema[enumKey].name.toLowerCase().includes(colNameLower)) {
        //         return enumsInSchema[enumKey];
        //     }
        // }
        return undefined;
    }

    function handleEnumBadgeClick(enumMeta: EnumMetadata | undefined) {
        if (enumMeta && onEnumClick) {
            onEnumClick({ name: enumMeta.name, values: enumMeta.values });
        }
    }

</script>

<div class="card bg-base-100 shadow-xl overflow-hidden">
    <div class="card-body p-0">
        {#if columns && columns.length > 0}
            <div class="overflow-x-auto">
                <table class="table table-sm w-full">
                    <thead>
                        <tr>
                            <th class="w-2/5 pl-4">Column</th>
                            <th class="w-3/5 pr-4">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each columns as column (column.name)}
                            {@const enumInfo = getEnumForColumn(column)}
                            <tr class="hover">
                                <td class="align-top py-2.5 pl-4">
                                    <div class="flex items-baseline">
                                        <span class="font-medium">{column.name}</span>
                                        {#if !column.nullable}
                                            <span class="text-error ml-1 select-none" title="Required field">*</span>
                                        {/if}
                                    </div>
                                    <div class="font-mono text-xs text-base-content/60 italic mt-0.5">{column.type}</div>
                                </td>
                                <td class="align-top py-2.5 pr-4 space-x-1.5">
                                    {#if column.isPrimaryKey}
                                        <span class="badge badge-accent badge-sm font-semibold">PK</span>
                                    {/if}
                                    {#if column.references}
                                        <span class="badge badge-secondary badge-sm">FK</span>
                                        <button
                                            class="link link-hover text-xs font-mono !text-info normal-case"
                                            onclick={() => handleFkButtonClick(column.references)}
                                            title="Navigate to {formatReferenceText(column.references)}"
                                        >
                                            {formatReferenceText(column.references)}
                                        </button>
                                    {/if}
                                    {#if enumInfo}
                                        <button
                                            class="badge badge-warning badge-sm hover:shadow-md transition-shadow normal-case"
                                            onclick={() => handleEnumBadgeClick(enumInfo)}
                                            title="Enum: {enumInfo.name} (Click to see values)"
                                        >
                                            <span class="mr-1 opacity-70">Enum:</span>{enumInfo.name}
                                        </button>
                                    {:else if column.isEnum}
                                         <span class="badge badge-ghost badge-sm normal-case" title="This column uses an enumerated type (details not auto-linked).">
                                            <span class="opacity-70">Enum</span>
                                        </span>
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {:else}
            <div class="p-6 text-center text-neutral-content/70">
                No columns defined for this {itemType}.
            </div>
        {/if}
    </div>
</div>