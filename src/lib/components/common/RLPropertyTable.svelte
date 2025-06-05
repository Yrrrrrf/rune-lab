<!-- src/lib/components/common/RLPropertyTable.svelte -->
<script lang="ts">
    import type { RLEnumMetadata, RLColumnReference, RLPropertyItem  } from '$lib/components/stores/explorer.svelte';

    let {
        items,
        title = '',
        nameHeader = "Name",
        detailHeader = "Details",
        enumsInSchema, // Keyed by enum definition name e.g., "status_enum"
        onFkClick,
        onEnumClick, // MUST be provided for clickable badge
        detail,
    } = $props<{
        items: RLPropertyItem[];
        title?: string;
        nameHeader?: string;
        detailHeader?: string;
        enumsInSchema?: Record<string, RLEnumMetadata>;
        onFkClick?: (ref: RLColumnReference) => void;
        onEnumClick?: (enumData: RLEnumMetadata) => void;
        detail?: (itemData: RLPropertyItem) => any; // Svelte 5 render snippet
    }>();

    // For debugging, log props on init or when they change
    $effect(() => {
        console.log('[RLPropertyTable] Props received:');
        console.log('  Items count:', items?.length);
        console.log('  EnumsInSchema keys:', enumsInSchema ? Object.keys(enumsInSchema) : 'undefined');
        console.log('  onEnumClick provided:', !!onEnumClick);
        console.log('  Detail function provided:', !!detail);
    });

    function findEnumForItem(item: RLPropertyItem): RLEnumMetadata | undefined {
        if (!item.isEnum || !enumsInSchema || Object.keys(enumsInSchema).length === 0) {
            // console.log(`[findEnumForItem] Item '${item.name}': Not an enum, or enumsInSchema missing/empty.`);
            return undefined;
        }

        const itemNameLower = item.name.toLowerCase(); // e.g., "status", "room_type"

        // Heuristic 1: item.name matches an enum key directly (e.g. item.name = "status_enum")
        if (enumsInSchema[item.name]) {
            // console.log(`[findEnumForItem] Item '${item.name}': Matched directly by item.name with key '${item.name}'`);
            return enumsInSchema[item.name];
        }

        // Heuristic 2: item.name + "_enum" matches an enum key (e.g. item.name="status" -> key "status_enum")
        const keyWithSuffix = `${itemNameLower}_enum`;
        if (enumsInSchema[keyWithSuffix]) {
            // console.log(`[findEnumForItem] Item '${item.name}': Matched with suffix as key '${keyWithSuffix}'`);
            return enumsInSchema[keyWithSuffix];
        }
        // Case-insensitive check for keyWithSuffix
        for (const enumKeyInSchema in enumsInSchema) {
            if (enumKeyInSchema.toLowerCase() === keyWithSuffix) {
                // console.log(`[findEnumForItem] Item '${item.name}': Matched case-insensitively with suffix to key '${enumKeyInSchema}'`);
                return enumsInSchema[enumKeyInSchema];
            }
        }


        // Heuristic 3: item.type matches an enum key (if item.type stores the enum's definition name)
        // This is less likely if item.type is the SQL storage type like VARCHAR.
        if (item.type && enumsInSchema[item.type]) {
            // console.log(`[findEnumForItem] Item '${item.name}': Matched by item.type ('${item.type}') with key '${item.type}'`);
            return enumsInSchema[item.type];
        }
        // Case-insensitive check for item.type
        if (item.type) {
            for (const enumKeyInSchema in enumsInSchema) {
                if (enumKeyInSchema.toLowerCase() === item.type.toLowerCase()) {
                     // console.log(`[findEnumForItem] Item '${item.name}': Matched case-insensitively by item.type to key '${enumKeyInSchema}'`);
                    return enumsInSchema[enumKeyInSchema];
                }
            }
        }

        // console.log(`[findEnumForItem] Item '${item.name}': No enum metadata found with current heuristics.`);
        return undefined;
    }
</script>

<div class="card bg-base-100 shadow-sm overflow-hidden my-2">
    {#if title}
        <div class="card-title p-3 text-sm font-semibold bg-base-200/50">{title}</div>
    {/if}
    <div class="card-body p-0">
        {#if items && items.length > 0}
            <div class="overflow-x-auto">
                <table class="table table-sm w-full">
                    <thead>
                        <tr>
                            <th class="w-2/5 pl-4">{nameHeader}</th>
                            {#if detailHeader} <th class="w-3/5 pr-4">{detailHeader}</th> {/if}
                        </tr>
                    </thead>
                    <tbody>
                        {#each items as item (item.name)}
                            {@const enumMeta = findEnumForItem(item)}
                            <!-- For debugging a specific item: -->
                            <!-- {#if item.name === 'status'}
                                {console.log('Processing item "status":', item, 'Found enumMeta:', enumMeta, 'onEnumClick:', !!onEnumClick)}
                            {/if} -->
                            <tr class="hover">
                                <td class="align-top py-2 pl-4">
                                    <div class="flex items-baseline">
                                        <span class="font-medium">{item.name}</span>
                                        {#if item.nullable === false && item.type && !item.type.toLowerCase().includes('bool')}
                                            <span class="text-error ml-1 select-none" title="Required field">*</span>
                                        {/if}
                                    </div>
                                    {#if item.type && detailHeader}
                                        <div class="font-mono text-xs text-base-content/60 italic mt-0.5">{item.type}</div>
                                    {/if}
                                </td>
                                {#if detailHeader}
                                <td class="align-top py-2 pr-4 space-x-1.5">
                                    {#if detail}
                                        {@render detail(item)}
                                    {:else}
                                        <!-- Default detail rendering -->
                                        {#if item.isPrimaryKey} <span class="badge badge-accent badge-xs font-semibold">PK</span> {/if}
                                        {#if item.references}
                                            <span class="badge badge-secondary badge-xs">FK</span>
                                            <button class="link link-hover text-xs font-mono !text-info normal-case"
                                                onclick={() => onFkClick && onFkClick(item.references!)}
                                                title="Navigate to {item.references.schema}.{item.references.table}.{item.references.column}">
                                                {item.references.schema}.{item.references.table}.{item.references.column}
                                            </button>
                                        {/if}
                                        
                                        {#if item.isEnum} <!-- Outer check if it's an enum at all -->
                                            {#if enumMeta && onEnumClick} <!-- Inner check: metadata found AND click handler provided -->
                                                 <button class="badge badge-warning badge-xs hover:shadow-md transition-shadow normal-case"
                                                    onclick={() => onEnumClick(enumMeta)}
                                                    title="Enum: {enumMeta.name} (Click to see values)">
                                                    <span class="mr-1 opacity-70">Enum:</span>{enumMeta.name}
                                                </button>
                                            {:else} <!-- Fallback: is an enum, but either metadata not linked or not clickable -->
                                                <span class="badge badge-ghost badge-xs" title={enumMeta ? `Enum: ${enumMeta.name} (details not interactive)` : `Enum type (details not linked for ${item.name})`}>
                                                    <span class="opacity-70">Enum</span>
                                                    {#if enumMeta} <!-- Show name if found, even if not clickable -->
                                                        ({enumMeta.name.substring(0,10)}{enumMeta.name.length > 10 ? '...' : ''})
                                                    {/if}
                                                </span>
                                            {/if}
                                        {/if}

                                        {#if item.mode} <span class="badge badge-info badge-xs">{item.mode}</span> {/if}
                                        {#if item.hasDefault} <span class="badge badge-outline badge-xs" title="Default: {item.defaultValue}">Has Default</span> {/if}
                                    {/if}
                                </td>
                                {/if}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {:else}
            <div class="p-4 text-center text-neutral-content/70">
                No items to display.
            </div>
        {/if}
    </div>
</div>