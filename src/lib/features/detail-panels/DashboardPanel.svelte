<script lang="ts">
    import { toastStore } from "$lib/state/toast.svelte";
    import { apiStore } from "$lib/state/api.svelte";
    import { themeStore } from "$lib/state/theme.svelte";
    import { shortcutStore } from "$lib/state/shortcuts.svelte";
    import { getCommandStore } from "$lib/state/commands.svelte";
    import { getAppStore } from "$lib/state/app.svelte";
    import { languageStore } from "$lib/state/language.svelte";
    import { currencyStore } from "$lib/state/currency.svelte";

    const appStore = getAppStore();
    // const commandStore = getCommandStore(); // Unused but available

    let beat = $state(false);
    let logs = $state<{ time: string; what: string }[]>([]);

    // Section 1: Reactive pulse
    const stateHash = $derived(
        [
            appStore.name,
            apiStore.connectionState,
            themeStore.current,
            toastStore.toasts.length,
            shortcutStore.entries.length,
        ].join("|"),
    );

    $effect(() => {
        stateHash; // Subscribe
        beat = true;
        const timer = setTimeout(() => (beat = false), 300);

        // Section 4: Event log
        const now = new Date();
        const time = now.toTimeString().split(" ")[0];
        const lastLog = logs[0];
        const currentWhat = `State Update: ${stateHash.split("|").slice(0, 3).join(", ")}`;

        if (!lastLog || lastLog.what !== currentWhat) {
            logs = [{ time, what: currentWhat }, ...logs].slice(0, 5);
        }

        return () => clearTimeout(timer);
    });

    // Section 3: Quick-fire actions
    function cycleTheme() {
        const themes = themeStore.available;
        const currentIndex = themes.findIndex(
            (t) => t.name === themeStore.current,
        );
        const nextIndex = (currentIndex + 1) % themes.length;
        themeStore.set(themes[nextIndex].name);
    }
</script>

<div class="space-y-8 animate-in fade-in duration-500">
    <!-- Header with Pulse -->
    <header class="flex items-center justify-between">
        <div>
            <h3 class="text-lg font-bold">Store Inspector</h3>
            <p class="text-xs opacity-50">Live reactive debugging</p>
        </div>
        <div
            class="w-3 h-3 rounded-full transition-all duration-300 {beat
                ? 'bg-primary scale-150 shadow-[0_0_15px_rgba(var(--p),0.5)]'
                : 'bg-base-content/20 scale-100'}"
        ></div>
    </header>

    <!-- Section 2: Store Snapshot -->
    <section class="space-y-3">
        <h4 class="text-[10px] font-black uppercase tracking-widest opacity-40">
            Snapshot
        </h4>
        <div class="overflow-x-auto border border-base-content/5 rounded-lg">
            <table class="table table-xs">
                <tbody>
                    <tr>
                        <td class="opacity-50">API</td>
                        <td class="font-mono text-primary"
                            >{apiStore.connectionState}</td
                        >
                    </tr>
                    <tr>
                        <td class="opacity-50">Theme</td>
                        <td class="font-mono">{themeStore.current}</td>
                    </tr>
                    <tr>
                        <td class="opacity-50">Lang</td>
                        <td class="font-mono">{languageStore.current}</td>
                    </tr>
                    <tr>
                        <td class="opacity-50">Toasts</td>
                        <td class="font-mono">{toastStore.toasts.length}</td>
                    </tr>
                    <tr>
                        <td class="opacity-50">Shortcuts</td>
                        <td class="font-mono">{shortcutStore.entries.length}</td
                        >
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    <!-- Section 3: Quick Actions -->
    <section class="space-y-3">
        <h4 class="text-[10px] font-black uppercase tracking-widest opacity-40">
            Control
        </h4>
        <div class="grid grid-cols-2 gap-2">
            <button
                onclick={() => toastStore.info("Pulse check!")}
                class="btn btn-xs btn-outline"
            >
                Toast Info
            </button>
            <button
                onclick={() => apiStore.reconnect()}
                class="btn btn-xs btn-outline"
            >
                Reconnect API
            </button>
            <button
                onclick={cycleTheme}
                class="btn btn-xs btn-outline col-span-2"
            >
                Cycle Theme
            </button>
        </div>
    </section>

    <!-- Section 4: Event Log -->
    <section class="space-y-3">
        <h4 class="text-[10px] font-black uppercase tracking-widest opacity-40">
            Activity
        </h4>
        <ul class="timeline timeline-vertical timeline-compact">
            {#each logs as log, i}
                <li>
                    {#if i !== 0}<hr class="bg-base-content/10" />{/if}
                    <div
                        class="timeline-start font-mono text-[10px] opacity-40"
                    >
                        {log.time}
                    </div>
                    <div class="timeline-middle">
                        <div
                            class="w-1.5 h-1.5 rounded-full bg-primary/50"
                        ></div>
                    </div>
                    <div
                        class="timeline-end text-[10px] truncate max-w-[160px]"
                    >
                        {log.what}
                    </div>
                    {#if i !== logs.length - 1}<hr
                            class="bg-base-content/10"
                        />{/if}
                </li>
            {/each}
        </ul>
    </section>
</div>
