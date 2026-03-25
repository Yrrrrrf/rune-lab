<script lang="ts">
    import ResourceSelector from "./ResourceSelector.svelte";
    import { getThemeStore, type Theme } from "@rune-lab/state";

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
</script>

<ResourceSelector
    store={themeStore}
    idKey="name"
    filterKeys={themes}
    {onchange}
>
    {#snippet triggerLabel(active)}
        <span class="text-lg">{active.icon}</span>
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
                {t.name}
            </span>
        </button>
    {/snippet}
</ResourceSelector>
