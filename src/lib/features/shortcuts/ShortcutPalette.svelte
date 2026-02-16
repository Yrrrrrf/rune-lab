<!-- src/lib/features/shortcuts/ShortcutPalette.svelte -->
<script lang="ts">
    import { onMount, tick } from "svelte";
    import {
        shortcutStore,
        type ShortcutEntry,
    } from "$lib/state/shortcuts.svelte";

    let dialog = $state<HTMLDialogElement>();
    let input = $state<HTMLInputElement>();
    let query = $state("");
    let isOpen = $state(false);

    // Filtered entries
    const filtered = $derived.by(() => {
        if (!query) return shortcutStore.active;
        const q = query.toLowerCase();
        return shortcutStore.active.filter(
            (e) =>
                e.label.toLowerCase().includes(q) ||
                e.category.toLowerCase().includes(q) ||
                e.keys.toLowerCase().includes(q),
        );
    });

    // Grouping logic
    const groups = $derived.by(() => {
        const result: Record<string, Record<string, ShortcutEntry[]>> = {};

        for (const entry of filtered) {
            const scope = entry.scope;
            const category = entry.category;

            if (!result[scope]) result[scope] = {};
            if (!result[scope][category]) result[scope][category] = [];

            result[scope][category].push(entry);
        }

        return result;
    });

    // Sort scopes: global first, then layout, then others
    const sortedScopes = $derived.by(() => {
        return Object.keys(groups).sort((a, b) => {
            if (a === "global") return -1;
            if (b === "global") return 1;
            if (a === "layout") return -1;
            if (b === "layout") return 1;
            return a.localeCompare(b);
        });
    });

    export function open() {
        isOpen = true;
        dialog?.showModal();
        tick().then(() => input?.focus());
    }

    export function close() {
        isOpen = false;
        dialog?.close();
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            close();
        }
    }

    function formatKeys(keys: string) {
        return keys.split(",")[0].split("+");
    }

    $effect(() => {
        shortcutStore.register({
            ...(shortcutStore.findConflicts("?", "global")[0] || {}), // Try to inherit if already there? No, let's just use LAYOUT_SHORTCUTS values
            id: "rl:shortcuts:open",
            keys: "?",
            label: "Show Shortcut Palette",
            category: "Help",
            scope: "global",
            handler: (e) => {
                // If we are already in an input, don't open
                const target = e.target as HTMLElement;
                if (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
                    return;

                e.preventDefault();
                open();
            },
        });

        return () => shortcutStore.unregister("rl:shortcuts:open");
    });
</script>

<dialog
    bind:this={dialog}
    class="modal items-start pt-[10vh] backdrop-blur-sm"
    onclose={close}
    onkeydown={handleKeydown}
>
    <div
        class="modal-box p-0 overflow-hidden border border-base-300 shadow-2xl max-w-3xl w-full flex flex-col"
    >
        <!-- Header / Search -->
        <div
            class="border-b border-base-200 p-6 flex items-center gap-4 bg-base-200/30"
        >
            <div class="p-2 bg-primary/10 rounded-lg text-primary">
                <svg
                    class="w-6 h-6"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><rect
                        width="18"
                        height="11"
                        x="3"
                        y="11"
                        rx="2"
                        ry="2"
                    /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg
                >
            </div>
            <div class="flex-1">
                <h2 class="text-xl font-bold tracking-tight">
                    Keyboard Shortcuts
                </h2>
                <p
                    class="text-xs opacity-50 uppercase tracking-widest font-medium"
                >
                    Discover application commands
                </p>
            </div>
            <div class="relative w-64">
                <input
                    bind:this={input}
                    bind:value={query}
                    type="text"
                    placeholder="Search shortcuts..."
                    class="input input-sm input-bordered w-full pr-8"
                />
                <span
                    class="absolute right-2 top-1/2 -translate-y-1/2 opacity-30 text-[10px] font-mono"
                    >/</span
                >
            </div>
        </div>

        <!-- Content -->
        <div class="max-h-[60vh] overflow-y-auto p-6 space-y-8">
            {#if sortedScopes.length === 0}
                <div class="py-12 text-center opacity-40 italic">
                    No shortcuts found matching "{query}"
                </div>
            {:else}
                {#each sortedScopes as scope}
                    <section class="space-y-4">
                        <header class="flex items-center gap-2">
                            <h3
                                class="text-xs font-black uppercase tracking-widest text-primary/70"
                            >
                                {scope === "global"
                                    ? "Global"
                                    : scope === "layout"
                                      ? "Layout"
                                      : scope.replace("panel:", "")}
                            </h3>
                            <div class="h-px flex-1 bg-primary/10"></div>
                        </header>

                        <div
                            class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4"
                        >
                            {#each Object.entries(groups[scope]) as [category, entries]}
                                <div class="space-y-2">
                                    <h4
                                        class="text-[10px] font-bold opacity-30 uppercase"
                                    >
                                        {category}
                                    </h4>
                                    <ul class="space-y-3">
                                        {#each entries as entry}
                                            <li
                                                class="flex items-center justify-between gap-4 group"
                                            >
                                                <span
                                                    class="text-sm opacity-80 group-hover:opacity-100 transition-opacity"
                                                >
                                                    {entry.label}
                                                </span>
                                                <div class="flex gap-1">
                                                    {#each formatKeys(entry.keys) as key}
                                                        <kbd
                                                            class="kbd kbd-sm font-mono text-[10px] min-w-[20px] bg-base-300 border-base-content/10"
                                                        >
                                                            {key === "cmd"
                                                                ? "⌘"
                                                                : key === "ctrl"
                                                                  ? "⌃"
                                                                  : key ===
                                                                      "shift"
                                                                    ? "⇧"
                                                                    : key ===
                                                                        "alt"
                                                                      ? "⌥"
                                                                      : key}
                                                        </kbd>
                                                    {/each}
                                                </div>
                                            </li>
                                        {/each}
                                    </ul>
                                </div>
                            {/each}
                        </div>
                    </section>
                {/each}
            {/if}
        </div>

        <!-- Footer -->
        <div
            class="bg-base-200/50 p-3 px-6 text-[10px] flex justify-between items-center opacity-50 border-t border-base-200"
        >
            <div class="flex gap-4">
                <span><kbd class="kbd kbd-xs">ESC</kbd> to close</span>
                <span><kbd class="kbd kbd-xs">?</kbd> to open help</span>
            </div>
            <div>rune-lab v0.0.19</div>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>
<!-- 
<style>
    @import "daisyui/components/modal.css";
    @import "daisyui/components/input.css";
    @import "daisyui/components/kbd.css";
    @import "daisyui/components/badge.css";
</style> -->
