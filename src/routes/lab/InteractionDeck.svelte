<script lang="ts">
    import {
        getToastStore,
        getShortcutStore,
        getCommandStore,
        getApiStore,
        getLayoutStore,
        createCartStore,
    } from "rune-lab";
    import { getContext } from "svelte";

    const toastStore = getToastStore();
    const shortcutStore = getShortcutStore();
    const commandStore = getCommandStore();
    const apiStore = getApiStore();
    const layoutStore = getLayoutStore();

    // SessionStore — optional (via context)
    const sessionStore: any = (() => {
        try {
            return getContext(Symbol.for("rl:session"));
        } catch {
            return null;
        }
    })();

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

    // ── Cart Controls ────────────────────────────────────────
    const mockProducts = [
        { id: "prod-1", name: "Router WRC-290", price: 12500 },
        { id: "prod-2", name: "Cat6 Cable Box", price: 3400 },
        { id: "prod-3", name: "RJ45 Connectors (100pk)", price: 850 },
        { id: "prod-4", name: "Fiber Patch Panel", price: 45000 },
    ];

    // We create a simple local cart — since the consumer app may not have configured one
    const localCart = createCartStore({
        idExtractor: (p: (typeof mockProducts)[0]) => p.id,
        priceExtractor: (p: (typeof mockProducts)[0]) => p.price,
    });

    // ── API Mock ─────────────────────────────────────────────
    function mockApiConnect(mode: "healthy" | "fail" | "throw") {
        const healthChecks: Record<string, () => Promise<boolean>> = {
            healthy: async () => true,
            fail: async () => {
                await new Promise((r) => setTimeout(r, 800));
                return false;
            },
            throw: async () => {
                await new Promise((r) => setTimeout(r, 500));
                throw new Error("Network error");
            },
        };
        apiStore.init("http://localhost:8000", "v1", healthChecks[mode]);
    }

    // ── Session Mock ─────────────────────────────────────────
    function mockSessionInit() {
        if (sessionStore) sessionStore.isReady = true;
    }

    function mockSessionLogin() {
        if (!sessionStore) return;
        sessionStore.isAuthenticated = true;
        sessionStore.user = {
            id: "user-1",
            name: "Lab User",
            email: "lab@rune.dev",
            role: "admin",
        };
    }

    function mockSessionLogout() {
        if (sessionStore) sessionStore.logout();
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
            <div class="flex gap-1 flex-wrap">
                <button
                    class="btn btn-xs btn-info"
                    onclick={() => fireToast("info")}>Info</button
                >
                <button
                    class="btn btn-xs btn-success"
                    onclick={() => fireToast("success")}>Success</button
                >
                <button
                    class="btn btn-xs btn-warning"
                    onclick={() => fireToast("warning")}>Warning</button
                >
                <button
                    class="btn btn-xs btn-error"
                    onclick={() => fireToast("error")}>Error</button
                >
                <button class="btn btn-xs btn-accent" onclick={floodToasts}
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
            <div class="flex gap-1">
                {#if !testShortcutRegistered}
                    <button
                        class="btn btn-xs btn-primary"
                        onclick={registerTestShortcut}>Register</button
                    >
                {:else}
                    <button
                        class="btn btn-xs btn-error"
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
            <div class="flex gap-1">
                {#if !commandsRegistered}
                    <button
                        class="btn btn-xs btn-primary"
                        onclick={registerMockCommands}
                        >Register 3 Commands</button
                    >
                {:else}
                    <button
                        class="btn btn-xs btn-error"
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

    <!-- Cart Controls -->
    <details class="collapse collapse-arrow bg-base-200">
        <summary class="collapse-title text-sm font-bold min-h-0 py-2"
            >🛒 Cart Controls</summary
        >
        <div class="collapse-content space-y-2">
            {#each mockProducts as product}
                <div class="flex items-center justify-between text-xs">
                    <span class="truncate flex-1">{product.name}</span>
                    <span class="font-mono opacity-50 mx-2"
                        >{product.price}¢</span
                    >
                    {#if localCart.has(product.id)}
                        <button
                            class="btn btn-xs btn-error btn-outline"
                            onclick={() => localCart.remove(product.id)}
                            >Remove</button
                        >
                    {:else}
                        <button
                            class="btn btn-xs btn-primary btn-outline"
                            onclick={() => localCart.add(product)}>Add</button
                        >
                    {/if}
                </div>
            {/each}
            <div
                class="border-t border-base-content/10 pt-2 flex justify-between text-xs font-bold"
            >
                <span>{localCart.totalItems} items</span>
                <span>{localCart.totalPrice} minor units</span>
            </div>
            <button
                class="btn btn-xs btn-ghost btn-block"
                onclick={() => localCart.clear()}>Clear Cart</button
            >
        </div>
    </details>

    <!-- API Mock -->
    <details class="collapse collapse-arrow bg-base-200">
        <summary class="collapse-title text-sm font-bold min-h-0 py-2"
            >🔌 API Mock</summary
        >
        <div class="collapse-content space-y-2">
            <div class="flex gap-1 flex-wrap">
                <button
                    class="btn btn-xs btn-success btn-outline"
                    onclick={() => mockApiConnect("healthy")}
                    >Connect (healthy)</button
                >
                <button
                    class="btn btn-xs btn-warning btn-outline"
                    onclick={() => mockApiConnect("fail")}
                    >Connect (fail)</button
                >
                <button
                    class="btn btn-xs btn-error btn-outline"
                    onclick={() => mockApiConnect("throw")}
                    >Connect (throw)</button
                >
            </div>
            <p class="text-xs opacity-50">
                State: {apiStore.connectionState}
            </p>
        </div>
    </details>

    <!-- Session Mock -->
    <details class="collapse collapse-arrow bg-base-200">
        <summary class="collapse-title text-sm font-bold min-h-0 py-2"
            >👤 Session Mock</summary
        >
        <div class="collapse-content space-y-2">
            {#if sessionStore}
                <div class="flex gap-1 flex-wrap">
                    <button
                        class="btn btn-xs btn-primary btn-outline"
                        onclick={mockSessionInit}>Initialize</button
                    >
                    <button
                        class="btn btn-xs btn-success btn-outline"
                        onclick={mockSessionLogin}>Mock Login</button
                    >
                    <button
                        class="btn btn-xs btn-error btn-outline"
                        onclick={mockSessionLogout}>Logout</button
                    >
                </div>
                <p class="text-xs opacity-50">
                    Ready: {sessionStore.isReady} · Auth: {sessionStore.isAuthenticated}
                </p>
            {:else}
                <p class="text-xs opacity-50">
                    Auth not enabled. Pass <code
                        >auth: {`{ enabled: true }`}</code
                    > to RuneProvider config.
                </p>
            {/if}
        </div>
    </details>
</div>
