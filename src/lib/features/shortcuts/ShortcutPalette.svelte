<!-- src/lib/features/shortcuts/ShortcutPalette.svelte -->
<script lang="ts">
    import { onMount, tick } from "svelte";
    import {
        shortcutStore,
        LAYOUT_SHORTCUTS,
        type ShortcutEntry,
    } from "$lib/state/shortcuts.svelte";
    import { appStore } from "$lib/state/app.svelte";
    import { Icon } from "$lib/index";

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

    // Grouping logic - simplified by using store's grouping
    const groups = $derived.by(() => {
        if (!query) return shortcutStore.byScopeAndCategory;

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

    // Scopes are now provided by the store
    const sortedScopes = $derived(
        query
            ? Object.keys(groups).sort((a, b) => {
                  if (a === "global") return -1;
                  if (b === "global") return 1;
                  if (a === "layout") return -1;
                  if (b === "layout") return 1;
                  return a.localeCompare(b);
              })
            : shortcutStore.sortedScopes,
    );

    export function open() {
        isOpen = true;
        shortcutStore.showPalette = true;
        tick().then(() => input?.focus());
    }

    export function close() {
        isOpen = false;
        shortcutStore.showPalette = false;
    }

    $effect(() => {
        if (shortcutStore.showPalette && !isOpen) {
            open();
        } else if (!shortcutStore.showPalette && isOpen) {
            close();
        }
    });

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
            ...LAYOUT_SHORTCUTS.OPEN_SHORTCUTS,
            handler: (e) => {
                // If we are already in an input, don't open
                const target = e.target as HTMLElement;
                if (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
                    return;

                e.preventDefault();
                open();
            },
        });

        return () =>
            shortcutStore.unregister(LAYOUT_SHORTCUTS.OPEN_SHORTCUTS.id);
    });
</script>

<dialog
    bind:this={dialog}
    class="modal items-start pt-[10vh] backdrop-blur-sm"
    class:modal-open={isOpen}
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
                <Icon name="shortcut" class="w-6 h-6" />
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
                <span
                    ><kbd class="kbd kbd-xs">ctrl</kbd> +
                    <kbd class="kbd kbd-xs">/</kbd> to open help</span
                >
            </div>
            <div>rune-lab v{appStore.version}</div>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button
            onclick={(e) => {
                e.preventDefault();
                close();
            }}>close</button
        >
    </form>
</dialog>
