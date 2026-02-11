<!-- src/client/sdk/ui/src/features/config/CommandPalette.svelte -->
<script lang="ts">
    import { onMount } from "svelte";

    interface Command {
        id: string;
        title: string;
        category?: string;
        icon?: string;
        action: () => void;
    }

    let { commands = [] }: { commands: Command[] } = $props();

    let dialog: HTMLDialogElement;
    let query = $state("");
    let isOpen = $state(false);

    // Filter commands based on query
    let filtered = $derived(
        query === ""
            ? commands
            : commands.filter((c) =>
                  c.title.toLowerCase().includes(query.toLowerCase()),
              ),
    );

    function toggle() {
        isOpen = !isOpen;
        if (isOpen) {
            dialog.showModal();
            query = ""; // Reset search
        } else {
            dialog.close();
        }
    }

    // Global keyboard listener
    onMount(() => {
        function handleKeydown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                toggle();
            }
        }
        window.addEventListener("keydown", handleKeydown);
        return () => window.removeEventListener("keydown", handleKeydown);
    });
</script>

<dialog
    bind:this={dialog}
    class="modal items-start pt-[10vh] backdrop-blur-sm"
    onclose={() => (isOpen = false)}
>
    <div
        class="modal-box p-0 overflow-hidden border border-base-300 shadow-2xl max-w-2xl w-full"
    >
        <!-- Search Input -->
        <div class="border-b border-base-200 p-4 flex items-center gap-3">
            <svg
                class="w-5 h-5 opacity-50"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"
                ></path></svg
            >
            <input
                type="text"
                class="bg-transparent outline-none w-full text-lg"
                placeholder="What do you need?"
                bind:value={query}
            />
            <kbd class="kbd kbd-sm">ESC</kbd>
        </div>

        <!-- Results -->
        <div class="max-h-[60vh] overflow-y-auto p-2">
            {#if filtered.length === 0}
                <div class="p-8 text-center text-base-content/50">
                    No results found for "{query}"
                </div>
            {:else}
                <ul class="menu w-full p-0">
                    {#each filtered as cmd}
                        <li>
                            <button
                                onclick={() => {
                                    cmd.action();
                                    toggle();
                                }}
                                class="flex justify-between items-center py-3"
                            >
                                <div class="flex items-center gap-3">
                                    {#if cmd.icon}
                                        <span>{cmd.icon}</span>
                                    {/if}
                                    <div class="flex flex-col items-start">
                                        <span class="font-medium"
                                            >{cmd.title}</span
                                        >
                                        {#if cmd.category}
                                            <span class="text-xs opacity-50"
                                                >{cmd.category}</span
                                            >
                                        {/if}
                                    </div>
                                </div>
                                <span class="text-xs opacity-40">↵</span>
                            </button>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>

        <div
            class="bg-base-200 p-2 text-xs text-center text-base-content/50 border-t border-base-200"
        >
            Search for actions, pages, or settings
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>
