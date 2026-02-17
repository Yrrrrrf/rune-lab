<script lang="ts">
    import { shortcutStore } from "$lib/state/shortcuts.svelte";
    import { Icon } from "$lib/index";

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

<div class="space-y-8 animate-in fade-in duration-500">
    <header>
        <h3 class="text-lg font-bold">Shortcut Registry</h3>
        <p class="text-xs opacity-50">Live conflict detection</p>
    </header>

    <!-- Section 1: Stats -->
    <section class="stats stats-vertical shadow-sm border border-base-content/5 w-full bg-base-200/30">
        <div class="stat p-3">
            <div class="stat-title text-[10px] uppercase font-bold tracking-tighter">Total</div>
            <div class="stat-value text-xl">{shortcutStore.entries.length}</div>
        </div>
        <div class="stat p-3">
            <div class="stat-title text-[10px] uppercase font-bold tracking-tighter">Active</div>
            <div class="stat-value text-xl text-primary">{shortcutStore.active.length}</div>
        </div>
    </section>

    <!-- Section 2: Conflicts -->
    <section class="space-y-3">
        <h4 class="text-[10px] font-black uppercase tracking-widest opacity-40">
            Health Check
        </h4>
        {#if conflicts.length > 0}
            <div class="alert alert-warning p-3 rounded-lg text-xs gap-2 flex-col items-start">
                <div class="flex items-center gap-2 font-bold">
                    ⚠️ Conflict Detected
                </div>
                <ul class="space-y-1 opacity-80">
                    {#each conflicts as conflict}
                        <li>
                            <code class="bg-base-100 px-1 rounded">{conflict.keys}</code> in <span class="badge badge-xs badge-outline">{conflict.scope}</span>
                        </li>
                    {/each}
                </ul>
            </div>
        {:else}
            <div class="alert alert-success alert-soft p-3 rounded-lg text-xs gap-2">
                ✅ No conflicts detected
            </div>
        {/if}
    </section>

    <!-- Section 3: Scope Breakdown -->
    <section class="space-y-3">
        <h4 class="text-[10px] font-black uppercase tracking-widest opacity-40">
            Scopes
        </h4>
        <div class="flex flex-wrap gap-2">
            {#each Object.entries(shortcutStore.byScopeAndCategory) as [scope, categories]}
                {@const count = Object.values(categories).flat().length}
                <div class="flex items-center gap-1.5 bg-base-200 px-2 py-1 rounded-full border border-base-content/5">
                    <span class="text-[10px] font-mono opacity-60 capitalize">{scope === 'global' ? 'Global' : scope.replace('panel:', '')}</span>
                    <span class="badge badge-xs badge-primary font-bold">{count}</span>
                </div>
            {/each}
        </div>
    </section>

    <!-- Section 4: Live Table -->
    <section class="space-y-3">
        <h4 class="text-[10px] font-black uppercase tracking-widest opacity-40">
            Live Entries
        </h4>
        <div class="overflow-x-auto border border-base-content/5 rounded-lg max-h-[300px] overflow-y-auto">
            <table class="table table-xs table-pin-rows">
                <thead>
                    <tr>
                        <th>Keys</th>
                        <th>Label</th>
                        <th>State</th>
                    </tr>
                </thead>
                <tbody>
                    {#each shortcutStore.entries as entry}
                        <tr>
                            <td>
                                <div class="flex gap-0.5">
                                    {#each formatKeys(entry.keys) as key}
                                        <kbd class="kbd kbd-xs text-[8px] opacity-70">{key}</kbd>
                                    {/each}
                                </div>
                            </td>
                            <td class="text-[10px] truncate max-w-[80px]">{entry.label}</td>
                            <td>
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
    </section>
</div>
