<script lang="ts">
    import {
        getToastStore,
        getShortcutStore,
        getCommandStore,
        getLayoutStore,
    } from "rune-lab";

    const toastStore = getToastStore();
    const shortcutStore = getShortcutStore();
    const commandStore = getCommandStore();
    const layoutStore = getLayoutStore();

    // ── Toast Cannon ─────────────────────────────────────────
    let toastDuration = $state(3000);

    function fireToast(type: "info" | "success" | "warning" | "error") {
        toastStore.send(
            `Test ${type} toast at ${new Date().toLocaleTimeString()}`,
            type,
            toastDuration,
        );
    }

    function floodToasts() {
        const types = ["info", "success", "warning", "error", "info"] as const;
        types.forEach((t, i) => {
            setTimeout(() => fireToast(t), i * 100);
        });
    }

    // ── Shortcut Lab ─────────────────────────────────────────
    let testShortcutKey = $state("ctrl+shift+t");
    let testShortcutLabel = $state("Test Shortcut");
    let testShortcutRegistered = $state(false);

    function registerTestShortcut() {
        shortcutStore.register({
            id: "lab:test-shortcut",
            keys: testShortcutKey,
            label: testShortcutLabel,
            category: "Lab",
            scope: "global",
            handler: () =>
                toastStore.success(`⚡ "${testShortcutLabel}" fired!`),
        });
        testShortcutRegistered = true;
    }

    function unregisterTestShortcut() {
        shortcutStore.unregister("lab:test-shortcut");
        testShortcutRegistered = false;
    }

    // ── Command Palette ──────────────────────────────────────
    let commandsRegistered = $state(false);

    function registerMockCommands() {
        commandStore.register({
            id: "lab:greet",
            label: "Say Hello",
            category: "Lab",
            icon: "👋",
            action: () => toastStore.success("Hello from the Lab!"),
        });
        commandStore.register({
            id: "lab:random",
            label: "Random Number",
            category: "Lab",
            icon: "🎲",
            action: () =>
                toastStore.info(`Random: ${Math.floor(Math.random() * 100)}`),
        });
        commandStore.register({
            id: "lab:nested",
            label: "Nested Commands",
            category: "Lab",
            icon: "📂",
            children: [
                {
                    id: "lab:nested:a",
                    label: "Sub-command A",
                    action: () => toastStore.info("Sub A executed"),
                },
                {
                    id: "lab:nested:b",
                    label: "Sub-command B",
                    action: () => toastStore.info("Sub B executed"),
                },
            ],
        });
        commandsRegistered = true;
    }

    function unregisterMockCommands() {
        commandStore.unregister("lab:greet");
        commandStore.unregister("lab:random");
        commandStore.unregister("lab:nested");
        commandsRegistered = false;
    }
</script>

<div class="h-full overflow-y-auto p-4 space-y-2">
    <h2
        class="text-xs font-black uppercase tracking-widest text-primary/70 mb-3"
    >
        Interaction Deck
    </h2>

    <!-- Toast Cannon -->
    <details open class="collapse collapse-arrow bg-base-200">
        <summary class="collapse-title text-sm font-bold min-h-0 py-2"
            >🔔 Toast Cannon</summary
        >
        <div class="collapse-content space-y-2">
            <div class="join flex-wrap">
                <button
                    class="btn btn-xs btn-info join-item"
                    onclick={() => fireToast("info")}>Info</button
                >
                <button
                    class="btn btn-xs btn-success join-item"
                    onclick={() => fireToast("success")}>Success</button
                >
                <button
                    class="btn btn-xs btn-warning join-item"
                    onclick={() => fireToast("warning")}>Warning</button
                >
                <button
                    class="btn btn-xs btn-error join-item"
                    onclick={() => fireToast("error")}>Error</button
                >
                <button class="btn btn-xs btn-accent join-item" onclick={floodToasts}
                    >🌊 Flood (5)</button
                >
            </div>
            <label class="flex items-center gap-2 text-xs">
                <span class="opacity-60">Duration:</span>
                <input
                    type="range"
                    min="0"
                    max="5000"
                    step="500"
                    class="range range-xs range-primary flex-1"
                    bind:value={toastDuration}
                />
                <span class="font-mono w-12 text-right"
                    >{toastDuration === 0 ? "∞" : `${toastDuration}ms`}</span
                >
            </label>
        </div>
    </details>

    <!-- Shortcut Lab -->
    <details class="collapse collapse-arrow bg-base-200">
        <summary class="collapse-title text-sm font-bold min-h-0 py-2"
            >⚡ Shortcut Lab</summary
        >
        <div class="collapse-content space-y-2">
            <div class="flex gap-2">
                <input
                    type="text"
                    class="input input-xs input-bordered flex-1"
                    placeholder="Key combo"
                    bind:value={testShortcutKey}
                />
                <input
                    type="text"
                    class="input input-xs input-bordered flex-1"
                    placeholder="Label"
                    bind:value={testShortcutLabel}
                />
            </div>
            <div class="join">
                {#if !testShortcutRegistered}
                    <button
                        class="btn btn-xs btn-primary join-item"
                        onclick={registerTestShortcut}>Register</button
                    >
                {:else}
                    <button
                        class="btn btn-xs btn-error join-item"
                        onclick={unregisterTestShortcut}>Unregister</button
                    >
                {/if}
            </div>
            <p class="text-xs opacity-50">
                Total shortcuts: {shortcutStore.entries.length}
            </p>
        </div>
    </details>

    <!-- Command Palette -->
    <details class="collapse collapse-arrow bg-base-200">
        <summary class="collapse-title text-sm font-bold min-h-0 py-2"
            >📋 Command Palette</summary
        >
        <div class="collapse-content space-y-2">
            <div class="join">
                {#if !commandsRegistered}
                    <button
                        class="btn btn-xs btn-primary join-item"
                        onclick={registerMockCommands}
                        >Register 3 Commands</button
                    >
                {:else}
                    <button
                        class="btn btn-xs btn-error join-item"
                        onclick={unregisterMockCommands}>Unregister All</button
                    >
                {/if}
            </div>
            <p class="text-xs opacity-50">
                Use <kbd class="kbd kbd-xs">Ctrl+Shift+K</kbd> to open palette
            </p>
            <p class="text-xs opacity-50">
                Registered: {commandStore.commands.length}
            </p>
        </div>
    </details>

</div>
