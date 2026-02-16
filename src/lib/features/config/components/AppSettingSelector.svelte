<script lang="ts">
    import { type Snippet } from "svelte";

    let { options, value, item, triggerLabel, tooltip } = $props<{
        options: any[];
        value: any;
        item: Snippet<[any]>;
        triggerLabel: Snippet<[any]>;
        tooltip?: string;
    }>();
</script>

<div class="dropdown dropdown-end">
    <div
        tabindex="0"
        role="button"
        class="btn btn-ghost btn-sm m-1 {tooltip
            ? 'tooltip tooltip-bottom'
            : ''}"
        data-tip={tooltip}
    >
        <span class="flex items-center gap-2">
            {@render triggerLabel(value)}
        </span>
    </div>

    <ul
        class="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm max-h-96 overflow-y-auto border border-base-200"
    >
        {#each options as option}
            <li>
                {@render item(option)}
            </li>
        {/each}
    </ul>
</div>

<!-- <style>
    @import "daisyui/components/dropdown.css";
    @import "daisyui/components/menu.css";
    @import "daisyui/components/button.css";
</style> -->
