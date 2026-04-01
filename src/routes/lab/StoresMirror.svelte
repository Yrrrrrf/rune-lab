<script lang="ts">
    import {
        getAppStore,
        getApiStore,
        getToastStore,
        getThemeStore,
        getLanguageStore,
        getCurrencyStore,
        getShortcutStore,
        getLayoutStore,
        getCommandStore,
    } from "rune-lab";
    import { getContext } from "svelte";

    const appStore = getAppStore();
    const apiStore = getApiStore();
    const toastStore = getToastStore();
    const themeStore = getThemeStore();
    const languageStore = getLanguageStore();
    const currencyStore = getCurrencyStore();
    const shortcutStore = getShortcutStore();
    const layoutStore = getLayoutStore();
    const commandStore = getCommandStore();

    // SessionStore is optional — safe getContext
    let sessionStore: any = null;
    try {
        sessionStore = getContext(Symbol.for("rl:session"));
    } catch {
        // Auth not enabled
    }

    // CartStore is optional
    let cartStore: any = null;
    try {
        cartStore = getContext(Symbol.for("rl:cart"));
    } catch {
        // Cart not configured
    }

    const connectionColors: Record<string, string> = {
        connected: "badge-success",
        connecting: "badge-warning",
        disconnected: "badge-error",
    };
</script>

<div class="h-full overflow-y-auto p-4">
    <h2
        class="text-xs font-black uppercase tracking-widest text-primary/70 mb-4"
    >
        Stores Mirror
    </h2>

    <div class="grid grid-cols-2 gap-3">
        <!-- AppStore -->
        <div class="card bg-base-200 p-3 gap-1">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold opacity-60">AppStore</span>
                <div class="status status-success status-sm"></div>
            </div>
            <p class="text-sm font-medium truncate">{appStore.name}</p>
            <p class="text-xs font-mono opacity-50">{appStore.version}</p>
        </div>

        <!-- ApiStore -->
        <div class="card bg-base-200 p-3 gap-1">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold opacity-60">ApiStore</span>
                <span
                    class="badge badge-xs {connectionColors[
                        apiStore.connectionState
                    ] ?? 'badge-ghost'}">{apiStore.connectionState}</span
                >
            </div>
            <p class="text-xs font-mono opacity-50 truncate">{apiStore.url}</p>
        </div>

        <!-- ToastStore -->
        <div class="card bg-base-200 p-3 gap-1">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold opacity-60">ToastStore</span>
                <span class="badge badge-xs badge-ghost"
                    >{toastStore.toasts.length}</span
                >
            </div>
            <p class="text-xs opacity-50">
                {toastStore.toasts.length > 0
                    ? `Last: ${toastStore.toasts[toastStore.toasts.length - 1]?.type}`
                    : "No active toasts"}
            </p>
        </div>

        <!-- ThemeStore -->
        <div class="card bg-base-200 p-3 gap-1">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold opacity-60">ThemeStore</span>
                <div class="status status-success status-sm"></div>
            </div>
            <p class="text-sm font-medium">
                {themeStore.getProp("icon")}
                {themeStore.current}
            </p>
        </div>

        <!-- LanguageStore -->
        <div class="card bg-base-200 p-3 gap-1">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold opacity-60">LanguageStore</span>
                <div class="status status-success status-sm"></div>
            </div>
            <p class="text-sm font-medium">
                {languageStore.getProp("flag")}
                {languageStore.current}
            </p>
        </div>

        <!-- CurrencyStore -->
        <div class="card bg-base-200 p-3 gap-1">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold opacity-60">CurrencyStore</span>
                <div class="status status-success status-sm"></div>
            </div>
            <p class="text-sm font-medium">
                {currencyStore.getProp("symbol")}
                {currencyStore.current}
            </p>
        </div>

        <!-- ShortcutStore -->
        <div class="card bg-base-200 p-3 gap-1">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold opacity-60">ShortcutStore</span>
                <span class="badge badge-xs badge-ghost"
                    >{shortcutStore.entries.length}</span
                >
            </div>
            <p class="text-xs opacity-50">
                Palette: {shortcutStore.showPalette ? "open" : "closed"}
            </p>
        </div>

        <!-- LayoutStore -->
        <div class="card bg-base-200 p-3 gap-1">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold opacity-60">LayoutStore</span>
                <div
                    class="status status-sm"
                    class:status-success={layoutStore.navOpen}
                    class:status-warning={!layoutStore.navOpen}
                ></div>
            </div>
            <p class="text-xs opacity-50">
                nav: {layoutStore.navOpen ? "open" : "closed"} · detail: {layoutStore.detailOpen
                    ? "open"
                    : "closed"}
            </p>
        </div>

        <!-- CommandStore -->
        <div class="card bg-base-200 p-3 gap-1">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold opacity-60">CommandStore</span>
                <span class="badge badge-xs badge-ghost"
                    >{commandStore.commands.length}</span
                >
            </div>
            <p class="text-xs opacity-50">Registered commands</p>
        </div>

        <!-- CartStore -->
        <div class="card bg-base-200 p-3 gap-1">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold opacity-60">CartStore</span>
                {#if cartStore}
                    <span class="badge badge-xs badge-ghost"
                        >{cartStore.totalItems}</span
                    >
                {:else}
                    <span class="badge badge-xs badge-error">N/A</span>
                {/if}
            </div>
            <p class="text-xs opacity-50">
                {#if cartStore}
                    {cartStore.totalItems} items · {cartStore.totalPrice} minor units
                {:else}
                    Not configured
                {/if}
            </p>
        </div>

        <!-- SessionStore -->
        <div class="card bg-base-200 p-3 gap-1 col-span-2">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold opacity-60">SessionStore</span>
                {#if sessionStore}
                    <div
                        class="status status-sm"
                        class:status-success={sessionStore.isAuthenticated}
                        class:status-warning={!sessionStore.isAuthenticated}
                    ></div>
                {:else}
                    <span class="badge badge-xs badge-error">N/A</span>
                {/if}
            </div>
            <p class="text-xs opacity-50">
                {#if sessionStore}
                    Ready: {sessionStore.isReady} · Auth: {sessionStore.isAuthenticated}
                    {#if sessionStore.user}
                        · {sessionStore.user.name}
                    {/if}
                {:else}
                    Auth not enabled
                {/if}
            </p>
        </div>
    </div>
</div>
