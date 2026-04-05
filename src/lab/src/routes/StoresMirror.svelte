<script lang="ts">
    import {
        getAppStore,
        getToastStore,
        getThemeStore,
        getLanguageStore,
        getCurrencyStore,
        getShortcutStore,
        getLayoutStore,
        getCommandStore,
    } from "rune-lab";

    const appStore = getAppStore();
    const toastStore = getToastStore();
    const themeStore = getThemeStore();
    const languageStore = getLanguageStore();
    const currencyStore = getCurrencyStore();
    const shortcutStore = getShortcutStore();
    const layoutStore = getLayoutStore();
    const commandStore = getCommandStore();
</script>

<div class="h-full overflow-y-auto p-4">
    <h2
        class="text-xs font-black uppercase tracking-widest text-primary/70 mb-4"
    >
        Stores Mirror
    </h2>

    <div class="grid grid-cols-2 gap-3">
        <!-- AppStore -->
        <div class="card bg-base-200">
            <div class="card-body p-3 gap-1">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold opacity-60">AppStore</span>
                    <div class="status status-success status-sm"></div>
                </div>
                <p class="text-sm font-medium truncate">{appStore.name}</p>
                <p class="text-xs font-mono opacity-50">{appStore.version}</p>
            </div>
        </div>


        <!-- ToastStore -->
        <div class="card bg-base-200">
            <div class="card-body p-3 gap-1">
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
        </div>

        <!-- ThemeStore -->
        <div class="card bg-base-200">
            <div class="card-body p-3 gap-1">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold opacity-60">ThemeStore</span>
                    <div class="status status-success status-sm"></div>
                </div>
                <p class="text-sm font-medium">
                    {themeStore.getProp("icon")}
                    {themeStore.current}
                </p>
            </div>
        </div>

        <!-- LanguageStore -->
        <div class="card bg-base-200">
            <div class="card-body p-3 gap-1">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold opacity-60">LanguageStore</span>
                    <div class="status status-success status-sm"></div>
                </div>
                <p class="text-sm font-medium">
                    {languageStore.getProp("flag")}
                    {languageStore.current}
                </p>
            </div>
        </div>

        <!-- CurrencyStore -->
        <div class="card bg-base-200">
            <div class="card-body p-3 gap-1">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold opacity-60">CurrencyStore</span>
                    <div class="status status-success status-sm"></div>
                </div>
                <p class="text-sm font-medium">
                    {currencyStore.getProp("symbol")}
                    {currencyStore.current}
                </p>
            </div>
        </div>

        <!-- ShortcutStore -->
        <div class="card bg-base-200">
            <div class="card-body p-3 gap-1">
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
        </div>

        <!-- LayoutStore -->
        <div class="card bg-base-200">
            <div class="card-body p-3 gap-1">
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
        </div>

        <!-- CommandStore -->
        <div class="card bg-base-200">
            <div class="card-body p-3 gap-1">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold opacity-60">CommandStore</span>
                    <span class="badge badge-xs badge-ghost"
                        >{commandStore.commands.length}</span
                    >
                </div>
                <p class="text-xs opacity-50">Registered commands</p>
            </div>
        </div>
    </div>
</div>
