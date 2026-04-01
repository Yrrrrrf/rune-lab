<script lang="ts">
    import {
        MoneyDisplay,
        MoneyInput,
        UserAvatar,
        NotificationBell,
        Icon,
        DatePicker,
        getLanguageStore,
        getCurrencyStore,
    } from "rune-lab";

    const languageStore = getLanguageStore();
    const currencyStore = getCurrencyStore();

    // All currency codes for the money row
    const allCurrencies = $derived(currencyStore.available.map((c) => c.code));

    // UserAvatar test state
    let avatarName = $state("John Doe");
    let notifCount = $state(3);

    // MoneyInput test state
    let moneyInputValue = $state(15000);

    // Icon grid — all built-in icons from rune-lab
    const iconNames = [
        "search",
        "chevron-down",
        "chevron-right",
        "info",
        "shortcut",
        "close",
        "external",
        "plus",
        "minus",
        "check",
        "trash",
        "edit",
        "grid",
        "list",
        "table",
        "arrow-left",
        "arrow-right",
        "menu",
        "bell",
        "user",
        "settings",
        "logout",
    ];
</script>

<div class="h-full overflow-y-auto p-4 space-y-4">
    <h2
        class="text-xs font-black uppercase tracking-widest text-primary/70 mb-3"
    >
        Components
    </h2>

    <!-- Money Row -->
    <div class="space-y-2">
        <h3 class="text-xs font-bold opacity-60">
            💰 MoneyDisplay — 150000 minor units in every currency
        </h3>
        <div class="flex flex-wrap gap-2">
            {#each allCurrencies as code}
                <div
                    class="badge badge-lg font-mono text-xs"
                    class:badge-primary={String(currencyStore.current) === code}
                    class:badge-ghost={String(currencyStore.current) !== code}
                >
                    <MoneyDisplay amount={150000} currency={code} />
                </div>
            {/each}
        </div>

        <h3 class="text-xs font-bold opacity-60 mt-3">
            MoneyInput (M-03 precision fix)
        </h3>
        <div class="flex items-center gap-3">
            <div class="w-48">
                <MoneyInput bind:amount={moneyInputValue} />
            </div>
            <span class="text-xs font-mono opacity-50"
                >Minor units: {moneyInputValue}</span
            >
        </div>
    </div>

    <!-- Component Row -->
    <div class="space-y-3">
        <!-- UserAvatar -->
        <div class="space-y-2">
            <h3 class="text-xs font-bold opacity-60">
                👤 UserAvatar — live name + size variants
            </h3>
            <div class="flex items-end gap-3">
                <input
                    type="text"
                    class="input input-xs input-bordered w-40"
                    placeholder="Name"
                    bind:value={avatarName}
                />
                <UserAvatar name={avatarName} size="xs" />
                <UserAvatar name={avatarName} size="sm" />
                <UserAvatar name={avatarName} size="md" />
                <UserAvatar name={avatarName} size="lg" />
            </div>
        </div>

        <!-- NotificationBell -->
        <div class="space-y-2">
            <h3 class="text-xs font-bold opacity-60">
                🔔 NotificationBell — counter test
            </h3>
            <div class="flex items-center gap-3">
                <NotificationBell unreadCount={notifCount} animate={true} />
                <input
                    type="range"
                    min="0"
                    max="150"
                    class="range range-xs range-primary w-32"
                    bind:value={notifCount}
                />
                <span class="text-xs font-mono opacity-50">{notifCount}</span>
            </div>
        </div>

        <!-- Icon Grid -->
        <div class="space-y-2">
            <h3 class="text-xs font-bold opacity-60">
                🎨 Icon grid — {iconNames.length} built-in icons
            </h3>
            <div class="flex flex-wrap gap-2">
                {#each iconNames as name}
                    <div class="tooltip tooltip-bottom" data-tip={name}>
                        <div
                            class="p-2 rounded-lg bg-base-200 hover:bg-primary/10 transition-colors cursor-default"
                        >
                            <Icon {name} size="w-4 h-4" />
                        </div>
                    </div>
                {/each}
            </div>
        </div>

        <!-- DatePicker -->
        <div class="space-y-2">
            <h3 class="text-xs font-bold opacity-60">
                📅 DatePicker — locale: {languageStore.current}
            </h3>
            <DatePicker />
        </div>
    </div>
</div>
