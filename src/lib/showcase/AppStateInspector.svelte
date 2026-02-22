<script lang="ts">
    /**
     * @devOnly Renders a live debug view of all Rune Lab store state.
     * Should only be rendered in development:
     * ```svelte
     * {#if import.meta.env.DEV}
     *     <AppStateInspector />
     * {/if}
     * ```
     */
    import * as m from "$lib/paraglide/messages.js";
    import StoreDetailCard from "./StoreDetailCard.svelte";
    import { getAppStore } from "$lib/state/app.svelte";
    import { getApiStore } from "$lib/state/api.svelte";
    import { getThemeStore } from "$lib/state/theme.svelte";
    import { getLanguageStore } from "$lib/state/language.svelte";
    import { getCurrencyStore } from "$lib/state/currency.svelte";
    import { getToastStore } from "$lib/state/toast.svelte";
    import { getCommandStore } from "$lib/state/commands.svelte";

    // Inject context stores
    const appStore = getAppStore();
    const apiStore = getApiStore();
    const themeStore = getThemeStore();
    const languageStore = getLanguageStore();
    const currencyStore = getCurrencyStore();
    const toastStore = getToastStore();
    const commandStore = getCommandStore();

    const storeState = $derived([
        {
            label: "App Info",
            labelKey: "app_info",
            icon: "📱",
            color: "primary",
            values: [
                {
                    key: "Name",
                    labelKey: "name_label",
                    value: appStore.name,
                },
                {
                    key: "Version",
                    labelKey: "version_label",
                    value: appStore.version,
                },
            ],
        },
        {
            label: "Appearance",
            labelKey: "appearance",
            icon: "🎨",
            color: "secondary",
            values: [
                {
                    key: "Theme",
                    labelKey: "current_theme",
                    value: `${themeStore.getProp("icon") || ""} ${themeStore.current}`,
                },
            ],
        },
        {
            label: "Localization",
            labelKey: "localization",
            icon: "🌐",
            color: "accent",
            values: [
                {
                    key: "Language",
                    labelKey: "current_language",
                    value: `${languageStore.getProp("flag") || ""} ${languageStore.current}`,
                },
                {
                    key: "Currency",
                    labelKey: "current_currency",
                    value: `${currencyStore.getProp("symbol") || ""} ${currencyStore.current}`,
                },
            ],
        },
    ] as any[]);

    function getStatusClass(state: string) {
        switch (state) {
            case "connected":
                return "text-success";
            case "connecting":
                return "text-warning";
            case "disconnected":
                return "text-error";
            default:
                return "";
        }
    }

    function t(fn: any, fallback: string) {
        return typeof fn === "function" ? fn() : fallback;
    }
</script>

<div
    class="w-full max-w-6xl mx-auto mt-12 space-y-8 animate-in fade-in slide-in-from-bottom duration-1000"
>
    <div class="flex flex-col gap-2 px-4">
        <h2 class="text-3xl font-black tracking-tight flex items-center gap-3">
            <span class="p-2 bg-primary/10 rounded-xl">🔍</span>
            {t(m.live_store_dashboard, "Live Store Dashboard")}
        </h2>
        <p class="text-base-content/50 font-medium">
            {t(
                m.real_time_monitor_desc,
                "Real-time reactive state monitor for Rune Lab stores",
            )}
        </p>
    </div>

    <!-- Top Row: Stats -->
    <div
        class="stats stats-vertical lg:stats-horizontal shadow-sm bg-base-200/50 border border-base-300 w-full backdrop-blur-md"
    >
        <div class="stat">
            <div
                class="stat-title uppercase text-[10px] font-bold tracking-widest opacity-60"
            >
                {t(m.api_status, "API Status")}
            </div>
            <div
                class="stat-value capitalize {getStatusClass(
                    apiStore.connectionState,
                )} text-2xl"
            >
                {apiStore.connectionState}
            </div>
            <div
                class="stat-desc font-mono text-[10px] opacity-50 truncate max-w-[200px]"
            >
                {apiStore.URL}
            </div>
        </div>

        <div class="stat">
            <div
                class="stat-title uppercase text-[10px] font-bold tracking-widest opacity-60"
            >
                {t(m.active_toasts, "Active Toasts")}
            </div>
            <div class="stat-value text-2xl">
                {toastStore.toasts.length}
            </div>
            <div class="stat-desc font-mono text-[10px] opacity-50">
                {t(m.currently_in_queue, "Currently in queue")}
            </div>
        </div>

        <div class="stat">
            <div
                class="stat-title uppercase text-[10px] font-bold tracking-widest opacity-60"
            >
                {t(m.commands_label, "Commands")}
            </div>
            <div class="stat-value text-2xl">
                {commandStore.commands.length}
            </div>
            <div class="stat-desc font-mono text-[10px] opacity-50">
                {t(m.registered_in_registry, "Registered in registry")}
            </div>
        </div>
    </div>

    <!-- Bottom Row: Detail Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {#each storeState as store}
            <StoreDetailCard {store} />
        {/each}
    </div>
</div>
