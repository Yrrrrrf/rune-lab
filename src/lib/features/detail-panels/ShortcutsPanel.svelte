<script lang="ts">
    import { getShortcutStore } from "$lib/state/shortcuts.svelte";
    import { Icon } from "$lib/index";

    const shortcutStore = getShortcutStore();

    // Section 2: Conflict detector
    const conflicts = $derived.by(() => {
        const keyMap = new Map<string, string[]>();
        const results: { keys: string; scope: string; ids: string[] }[] = [];

        for (const entry of shortcutStore.entries) {
            const key = `${entry.keys}|${entry.scope}`;
            if (!keyMap.has(key)) {
                keyMap.set(key, []);
            }
            keyMap.get(key)!.push(entry.id);
        }

        for (const [key, ids] of keyMap.entries()) {
            if (ids.length > 1) {
                const [keys, scope] = key.split("|");
                results.push({ keys, scope, ids });
            }
        }
        return results;
    });

    function formatKeys(keys: string) {
        return keys.split("+");
    }
</script>

<div class="space-y-4 animate-in fade-in duration-500">
    <header>
        <h3 class="text-lg font-bold">Shortcut Registry</h3>
        <p class="text-xs opacity-50">Live conflict detection and management</p>
    </header>

    <!-- Section 1: Stats -->
    <details
        class="collapse collapse-arrow border border-base-content/10 bg-base-100/50 rounded-lg"
    >
        <summary
            class="collapse-title text-sm font-medium flex items-center gap-2"
        >
            <Icon name="info" class="w-4 h-4 opacity-70" />

            Registry Stats
            <span class="badge badge-sm badge-neutral ml-auto"
                >{shortcutStore.entries.length} total</span
            >
        </summary>
        <div class="collapse-content">
            <div
                class="stats stats-vertical lg:stats-horizontal shadow-sm w-full bg-transparent"
            >
                <div class="stat p-4 border-none">
                    <div
                        class="stat-title text-[10px] uppercase font-bold tracking-tighter"
                    >
                        Total Entries
                    </div>
                    <div class="stat-value text-xl">
                        {shortcutStore.entries.length}
                    </div>
                </div>
                <div class="stat p-4 border-none">
                    <div
                        class="stat-title text-[10px] uppercase font-bold tracking-tighter"
                    >
                        Active
                    </div>
                    <div class="stat-value text-xl text-primary">
                        {shortcutStore.active.length}
                    </div>
                </div>
            </div>
        </div>
    </details>

    <!-- Section 2: Conflicts -->
    <details
        class="collapse collapse-arrow border border-base-content/10 bg-base-100/50 rounded-lg"
        open={conflicts.length > 0}
    >
        <summary
            class="collapse-title text-sm font-medium flex items-center gap-2"
        >
            <Icon name="info" class="w-4 h-4 opacity-70" />

            Health Check
            {#if conflicts.length > 0}
                <span class="badge badge-sm badge-warning ml-auto"
                    >{conflicts.length} conflicts</span
                >
            {:else}
                <span class="badge badge-sm badge-success ml-auto">Healthy</span
                >
            {/if}
        </summary>
        <div class="collapse-content space-y-3 pt-2">
            {#if conflicts.length > 0}
                <div
                    class="alert alert-warning p-3 rounded-lg text-xs gap-2 flex-col items-start shadow-none"
                >
                    <div class="flex items-center gap-2 font-bold">
                        ⚠️ Conflict Detected
                    </div>
                    <ul class="space-y-1 opacity-80 list-disc list-inside">
                        {#each conflicts as conflict}
                            <li>
                                <code class="bg-white/20 px-1 rounded"
                                    >{conflict.keys}</code
                                >
                                in
                                <span class="badge badge-xs badge-outline"
                                    >{conflict.scope}</span
                                >
                            </li>
                        {/each}
                    </ul>
                </div>
            {:else}
                <div
                    class="alert alert-success p-3 rounded-lg text-xs gap-2 shadow-none bg-success/10 text-success-content border-none"
                >
                    ✅ No conflicts detected across all scopes.
                </div>
            {/if}
        </div>
    </details>

    <!-- Section 3: Live Table -->
    <details
        class="collapse collapse-arrow border border-base-content/10 bg-base-100/50 rounded-lg"
        open
    >
        <summary
            class="collapse-title text-sm font-medium flex items-center gap-2"
        >
            <Icon name="shortcut" class="w-4 h-4 opacity-70" />

            Live Entries
        </summary>
        <div class="collapse-content pt-2">
            <div
                class="overflow-x-auto border border-base-content/5 rounded-lg max-h-[400px] overflow-y-auto bg-base-100"
            >
                <table class="table table-xs table-pin-rows">
                    <thead>
                        <tr class="bg-base-200/50">
                            <th>Keys</th>
                            <th>Scope</th>
                            <th>Label</th>
                            <th class="text-right">State</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each shortcutStore.entries as entry}
                            <tr class="hover:bg-base-200/50 transition-colors">
                                <td class="font-mono">
                                    <div class="flex flex-wrap gap-1">
                                        {#each formatKeys(entry.keys) as key}
                                            <kbd
                                                class="kbd kbd-xs text-[9px] font-bold opacity-80"
                                                >{key}</kbd
                                            >
                                        {/each}
                                    </div>
                                </td>
                                <td>
                                    <span
                                        class="badge badge-ghost badge-xs font-mono opacity-70"
                                    >
                                        {entry.scope === "global"
                                            ? "Global"
                                            : entry.scope.replace("panel:", "")}
                                    </span>
                                </td>
                                <td
                                    class="text-[10px] max-w-[120px] truncate"
                                    title={entry.label}>{entry.label}</td
                                >
                                <td class="text-right">
                                    <input
                                        type="checkbox"
                                        class="toggle toggle-xs toggle-primary"
                                        checked={entry.enabled !== false}
                                        onchange={(e) => {
                                            if (e.currentTarget.checked) {
                                                shortcutStore.enable(entry.id);
                                            } else {
                                                shortcutStore.disable(entry.id);
                                            }
                                        }}
                                    />
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <div class="mt-4">
                <h4
                    class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2"
                >
                    Scope Breakdown
                </h4>
                <div class="flex flex-wrap gap-2">
                    {#each Object.entries(shortcutStore.byScopeAndCategory) as [scope, categories]}
                        {@const count = Object.values(categories).flat().length}
                        <div
                            class="flex items-center gap-1.5 bg-base-200 px-2 py-1 rounded badge badge-ghost border border-base-content/5 h-auto"
                        >
                            <span
                                class="text-[10px] font-mono opacity-60 capitalize"
                                >{scope === "global"
                                    ? "Global"
                                    : scope.replace("panel:", "")}</span
                            >
                            <span
                                class="badge badge-xs badge-primary font-bold border-none ml-1"
                                >{count}</span
                            >
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    </details>
</div>
