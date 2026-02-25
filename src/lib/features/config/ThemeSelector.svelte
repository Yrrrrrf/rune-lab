<script lang="ts">
    import AppSettingSelector from "./AppSettingSelector.svelte";
    import { getThemeStore, type Theme } from "$lib/state/theme.svelte";
    import * as rlMessages from "$lib/paraglide/messages.js";
    import { getContext } from "svelte";

    const themeStore = getThemeStore();

    let {
        themes = [],
        current = $bindable(themeStore.current),
        onchange,
    }: {
        themes?: string[];
        current?: string;
        onchange?: (value: string) => void;
    } = $props();

    const userDictionary =
        getContext<Record<string, any>>("rl:dictionary") ?? {};

    function getThemeLabel(theme: Theme): string {
        const key = theme.name;
        if (typeof userDictionary[key] === "function")
            return userDictionary[key]();
        if (typeof (rlMessages as any)[key] === "function")
            return (rlMessages as any)[key]();
        return theme.name;
    }

    let activeTheme = $derived(
        themeStore.get(themeStore.current) ?? themeStore.available[0],
    );

    let available = $derived(
        themes.length > 0
            ? themeStore.available.filter((t) => themes.includes(t.name))
            : themeStore.available,
    );
</script>

<AppSettingSelector
    value={activeTheme}
    options={available}
    tooltip={getThemeLabel(activeTheme)}
>
    {#snippet triggerLabel()}
        <span class="text-lg">{activeTheme.icon}</span>
    {/snippet}

    {#snippet item(t)}
        <button
            class="flex items-center gap-3 w-full"
            onclick={() => {
                themeStore.set(t.name);
                current = t.name;
                onchange?.(t.name);
            }}
        >
            <input
                type="radio"
                name="theme-{t.name}"
                class="theme-controller radio radio-xs"
                value={t.name}
                bind:group={themeStore.current}
            />
            <span class="text-lg">{t.icon}</span>
            <span class="capitalize">
                {getThemeLabel(t)}
            </span>
        </button>
    {/snippet}
</AppSettingSelector>
