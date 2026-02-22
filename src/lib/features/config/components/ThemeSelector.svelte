<script lang="ts">
    import AppSettingSelector from "./AppSettingSelector.svelte";
    import { getThemeStore, type Theme } from "$lib/state/theme.svelte";

    const themeStore = getThemeStore();

    import { getContext } from "svelte";
    import { createMessageResolver } from "$lib/internal/message-resolver";

    let {
        themes = [],
        current = $bindable(themeStore.current),
        onchange,
    }: {
        themes?: string[];
        current?: string;
        onchange?: (value: string) => void;
    } = $props();

    const dictionary = getContext<Record<string, any>>("rl:dictionary") || {};

    const getThemeLabel = createMessageResolver<Theme>(dictionary as any, {
        keyExtractor: (t) => t.name,
    });

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
    {#snippet triggerLabel(t)}
        <span class="text-lg">{t?.icon ?? activeTheme.icon}</span>
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
                name="theme-dropdown"
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
