<!-- src/client/sdk/ui/src/features/config/CommandPalette.svelte -->
<script lang="ts">
    import { onMount, tick } from "svelte";
    import { getCommandStore, type Command } from "$lib/state/commands.svelte";
    import { getShortcutStore } from "$lib/state/shortcuts.svelte";
    import { Icon } from "$lib/index";

    let { shortcutKey = "shift+k" } = $props<{ shortcutKey?: string }>();

    const commandStore = getCommandStore();
    const shortcutStore = getShortcutStore();

    let dialog: HTMLDialogElement;
    let input: HTMLInputElement;
    let query = $state("");
    let isOpen = $state(false);
    let selectedIndex = $state(0);
    let navigationStack = $state<string[]>([]);

    const currentParentId = $derived(
        navigationStack[navigationStack.length - 1],
    );
    const filtered = $derived(commandStore.search(query, currentParentId));

    $effect(() => {
        // Register shortcut
        shortcutStore.register({
            id: "rl:cmd:open",
            keys: `cmd+${shortcutKey},ctrl+${shortcutKey}`,
            label: "Open Command Palette",
            category: "General",
            scope: "global",
            handler: (e) => {
                e.preventDefault();
                toggle();
            },
        });

        return () => shortcutStore.unregister("rl:cmd:open");
    });

    $effect(() => {
        // Reset selection when query or navigation changes
        // Accessing these ensures the effect re-runs when they change
        query;
        navigationStack.length;
        selectedIndex = 0;
    });

    $effect(() => {
        // Ensure selected item is visible
        if (isOpen && filtered.length > 0) {
            // Use a small delay to ensure the DOM has updated
            tick().then(() => {
                const selectedElement = dialog?.querySelector(
                    ".menu li button.active",
                );
                selectedElement?.scrollIntoView({ block: "nearest" });
            });
        }
    });

    function toggle() {
        isOpen = !isOpen;
        if (isOpen) {
            query = "";
            navigationStack = [];
            selectedIndex = 0;
            tick().then(() => input?.focus());
        }
    }

    function handleAction(cmd: Command) {
        if (cmd.children && cmd.children.length > 0) {
            navigationStack.push(cmd.id);
            query = "";
            selectedIndex = 0;
        } else if (cmd.action) {
            cmd.action();
            isOpen = false;
        }
    }

    function goBack() {
        if (navigationStack.length > 0) {
            navigationStack.pop();
            query = "";
            selectedIndex = 0;
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (filtered.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % filtered.length;
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedIndex =
                (selectedIndex - 1 + filtered.length) % filtered.length;
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filtered[selectedIndex]) {
                handleAction(filtered[selectedIndex]);
            }
        } else if (
            e.key === "Backspace" &&
            query === "" &&
            navigationStack.length > 0
        ) {
            e.preventDefault();
            goBack();
        } else if (e.key === "Escape") {
            isOpen = false;
        }
    }
</script>

<dialog
    bind:this={dialog}
    class="modal items-start pt-[10vh] backdrop-blur-sm"
    class:modal-open={isOpen}
    onkeydown={handleKeyDown}
>
    <div
        class="modal-box p-0 overflow-hidden border border-base-300 shadow-2xl max-w-2xl w-full flex flex-col"
    >
        <!-- Breadcrumbs for Navigation -->
        {#if navigationStack.length > 0}
            <div class="breadcrumbs text-xs px-4 pt-4 opacity-50">
                <ul>
                    <li><button onclick={goBack}>Root</button></li>
                    {#each navigationStack as id}
                        <li><span class="font-bold">{id}</span></li>
                    {/each}
                </ul>
            </div>
        {/if}

        <!-- Search Input -->
        <div class="border-b border-base-200 p-4 flex items-center gap-3">
            <Icon name="search" class="opacity-50" />
            <input
                bind:this={input}
                type="text"
                class="bg-transparent outline-none w-full text-lg"
                placeholder={navigationStack.length > 0
                    ? "Search in subcommands..."
                    : "What do you need?"}
                bind:value={query}
            />
            <div class="flex gap-1">
                <kbd class="kbd kbd-sm">↑↓</kbd>
                <kbd class="kbd kbd-sm">↵</kbd>
            </div>
        </div>

        <!-- Results -->
        <div class="max-h-[60vh] overflow-y-auto p-2">
            {#if filtered.length === 0}
                <div class="p-8 text-center text-base-content/50">
                    No results found for "{query}"
                </div>
            {:else}
                <ul class="menu w-full p-0 gap-1">
                    {#each filtered as cmd, i}
                        <li>
                            <button
                                onclick={() => handleAction(cmd)}
                                class="flex justify-between items-center py-3 {i ===
                                selectedIndex
                                    ? 'active bg-primary text-primary-content'
                                    : ''}"
                            >
                                <div class="flex items-center gap-3">
                                    {#if cmd.icon}
                                        <span class="text-xl">{cmd.icon}</span>
                                    {/if}
                                    <div class="flex flex-col items-start">
                                        <span class="font-medium"
                                            >{cmd.label}</span
                                        >
                                        {#if cmd.category}
                                            <span class="text-xs opacity-70"
                                                >{cmd.category}</span
                                            >
                                        {/if}
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    {#if cmd.children && cmd.children.length > 0}
                                        <span
                                            class="badge badge-sm badge-outline opacity-50"
                                            >{cmd.children.length}</span
                                        >
                                        <span class="text-xs opacity-40">→</span
                                        >
                                    {:else}
                                        <span class="text-xs opacity-40">↵</span
                                        >
                                    {/if}
                                </div>
                            </button>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>

        <div
            class="bg-base-200 p-2 text-[10px] uppercase tracking-widest text-center text-base-content/40 border-t border-base-200"
        >
            {navigationStack.length > 0
                ? "Backspace to go back"
                : "Search actions, pages, or settings"}
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button
            onclick={(e) => {
                e.preventDefault();
                isOpen = false;
            }}>close</button
        >
    </form>
</dialog>
