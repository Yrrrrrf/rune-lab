<script lang="ts" module>
    import { type Snippet } from "svelte";

    export interface AppSettingSelectorProps<T> {
        options: T[];
        value: T;
        item: Snippet<[T]>;
        triggerLabel: Snippet<[T]>;
        tooltip?: string;
        direction?: "top" | "bottom" | "left" | "right" | "end" | "auto";
        responsive?: boolean;
    }
</script>

<script lang="ts" generics="T">
    import { portal } from "../../../kernel/src/mod.ts";

    let {
        options,
        value,
        item,
        triggerLabel,
        tooltip,
        direction = "bottom",
        responsive = true,
    } = $props<{
        options: T[];
        value: T;
        item: Snippet<[T]>;
        triggerLabel: Snippet<[T]>;
        tooltip?: string;
        direction?: "top" | "bottom" | "left" | "right" | "end" | "auto";
        responsive?: boolean;
    }>();

    let modal = $state<HTMLDialogElement>();

    let isOpen = $state(false);
    let triggerEl = $state<HTMLElement>();
    // FIX: track the portaled panel so clicks inside it are not treated as
    // "outside" clicks. The panel lives outside triggerEl in the DOM (portal).
    let panelEl = $state<HTMLElement | null>(null);
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

    // FIX: removed `capture: true`.
    //
    // With capture:true, handleOutsideClick fired BEFORE the item button's
    // onclick. Because Svelte 5 flushes {#if} DOM removals synchronously in
    // the same reactive batch, the panel was torn down before the bubble phase
    // could deliver the click to the button. Result: LanguageSelector and
    // CurrencySelector needed two clicks (ThemeSelector was immune only
    // because its radio `change` event is a separate, later event).
    //
    // Without capture:true the order is:
    //   button onclick → wrapper div onclick (close) → document bubble
    // The item action runs first; then we close; then outside-click check.
    //
    // panelEl is checked too: even after the panel is removed from the live
    // DOM, the detached node still answers .contains() correctly, so we never
    // double-close on a panel click.
    function handleOutsideClick(e: MouseEvent) {
        const target = e.target as Node;
        if (!triggerEl?.contains(target) && !panelEl?.contains(target)) {
            close();
        }
    }

    // FIX: named function so we can actually remove it in cleanup.
    // Before, an inline arrow was passed to addEventListener and could never
    // be removed — a new Escape handler stacked up on every open.
    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") close();
    }

    $effect(() => {
        if (isOpen) {
            document.addEventListener("click", handleOutsideClick);
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.removeEventListener("click", handleOutsideClick);
            document.removeEventListener("keydown", handleKeyDown); // was missing
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
                                <div
                                    role="button"
                                    tabindex="0"
                                    class="w-full text-left py-3 cursor-pointer hover:bg-base-200 px-4 transition-colors"
                                    onclick={() => modal?.close()}
                                    onkeydown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            modal?.close();
                                        }
                                    }}
                                >
                                    {@render item(option)}
                                </div>
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
    <!-- FIX: bind:this={panelEl} so handleOutsideClick can exclude it -->
    <div
        bind:this={panelEl}
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
