<script lang="ts">
    import { type Snippet } from "svelte";

    let {
        options,
        value,
        item,
        triggerLabel,
        tooltip,
        direction = "bottom",
        responsive = true,
    } = $props<{
        options: any[];
        value: any;
        item: Snippet<[any]>;
        triggerLabel: Snippet<[any]>;
        tooltip?: string;
        direction?: "top" | "bottom" | "left" | "right" | "end";
        responsive?: boolean;
    }>();

    let modal = $state<HTMLDialogElement>();

    // Use derived to compute the class, though simple reactive assignment works too
    const directionClass = $derived(
        (() => {
            switch (direction) {
                case "top":
                    return "dropdown-top";
                case "left":
                    return "dropdown-left";
                case "right":
                    return "dropdown-right";
                case "end":
                    return "dropdown-end"; // same as right in LTR, but specifically for alignment
                default:
                    return "dropdown-bottom";
            }
        })(),
    );
</script>

<!-- Mobile Modal Implementation -->
{#if responsive}
    <div class="md:hidden inline-block">
        <button
            type="button"
            class="btn btn-ghost btn-sm m-1 h-auto min-h-[2rem] px-2"
            aria-haspopup="dialog"
            onclick={() => modal?.showModal()}
        >
            <span class="flex items-center gap-2">
                {@render triggerLabel(value)}
            </span>
        </button>

        <dialog bind:this={modal} class="modal modal-bottom sm:modal-middle">
            <div class="modal-box p-0 overflow-hidden">
                <div
                    class="p-4 bg-base-200 border-b border-base-300 flex justify-between items-center"
                >
                    <h3 class="font-bold text-lg">Select Option</h3>
                    <form method="dialog">
                        <button class="btn btn-sm btn-circle btn-ghost"
                            >✕</button
                        >
                    </form>
                </div>
                <div class="max-h-[60vh] overflow-y-auto p-2">
                    <ul class="menu bg-base-100 w-full p-0" role="menu">
                        {#each options as option}
                            <li
                                class="border-b border-base-100 last:border-0"
                                role="menuitem"
                            >
                                <button
                                    class="w-full text-left py-3"
                                    onclick={() => modal?.close()}
                                >
                                    {@render item(option)}
                                </button>
                            </li>
                        {/each}
                    </ul>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button>close</button>
            </form>
        </dialog>
    </div>
{/if}

<!-- Desktop Dropdown Implementation -->
<div
    class="dropdown {directionClass} {responsive
        ? 'hidden md:inline-block'
        : 'inline-block'}"
>
    <div
        tabindex="0"
        role="button"
        aria-haspopup="menu"
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
        role="menu"
        class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow-xl border border-base-200 max-h-96 overflow-y-auto"
    >
        {#each options as option}
            <li role="menuitem">
                {@render item(option)}
            </li>
        {/each}
    </ul>
</div>
