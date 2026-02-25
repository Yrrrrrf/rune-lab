<script lang="ts">
    import { portal } from "$lib/actions/portal";
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
        direction?: "top" | "bottom" | "left" | "right" | "end" | "auto";
        responsive?: boolean;
    }>();

    let modal = $state<HTMLDialogElement>();

    let isOpen = $state(false);
    let triggerEl = $state<HTMLElement>();
    let panelStyle = $state("position:fixed;visibility:hidden");

    function computePosition() {
        if (!triggerEl) return;
        const rect = triggerEl.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const openUpward =
            direction === "top" ||
            (direction === "auto" &&
                spaceBelow < 200 &&
                spaceAbove > spaceBelow);

        if (openUpward) {
            panelStyle = `position:fixed; bottom:${window.innerHeight - rect.top + 4}px; left:${rect.left}px; min-width:${rect.width}px; z-index:9999`;
        } else {
            panelStyle = `position:fixed; top:${rect.bottom + 4}px; left:${rect.left}px; min-width:${rect.width}px; z-index:9999`;
        }
    }

    function open() {
        computePosition();
        isOpen = true;
    }

    function close() {
        isOpen = false;
    }

    function handleOutsideClick(e: MouseEvent) {
        if (!triggerEl?.contains(e.target as Node)) close();
    }

    $effect(() => {
        if (isOpen) {
            document.addEventListener("click", handleOutsideClick, {
                capture: true,
            });
            document.addEventListener(
                "keydown",
                (e) => e.key === "Escape" && close(),
            );
        }
        return () => {
            document.removeEventListener("click", handleOutsideClick, {
                capture: true,
            });
        };
    });
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
    bind:this={triggerEl}
    class="relative {responsive ? 'hidden md:inline-block' : 'inline-block'}"
>
    <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onclick={open}
        class="btn btn-ghost btn-sm m-1 {tooltip
            ? 'tooltip tooltip-bottom'
            : ''}"
        data-tip={tooltip}
    >
        <span class="flex items-center gap-2">
            {@render triggerLabel(value)}
        </span>
    </button>
</div>

{#if isOpen}
    <div
        use:portal
        style={panelStyle}
        class={responsive ? "hidden md:block" : "block"}
    >
        <ul
            role="listbox"
            class="menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow-xl border border-base-200 max-h-96 overflow-y-auto"
        >
            {#each options as option}
                <li role="option" aria-selected={value === option}>
                    <!-- Event delegation: we close on click unless they clicked the scrollbar -->
                    <!-- In a real world component you'd wrap the button down here or add a capture handler -->
                    <div
                        role="presentation"
                        onclick={close}
                        onkeydown={(e) => e.key === "Enter" && close()}
                        tabindex="-1"
                        class="w-full"
                    >
                        {@render item(option)}
                    </div>
                </li>
            {/each}
        </ul>
    </div>
{/if}
