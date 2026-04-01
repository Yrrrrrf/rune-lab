<script lang="ts">
    import AppSettingSelector from "./AppSettingSelector.svelte";
    import type { ConfigStore } from "../../../kernel/src/mod.ts";
    import * as rlMessages from "../../../i18n/paraglide/messages.ts";
    import { getContext, type Snippet } from "svelte";

    /**
     * ResourceSelector — Generic configuration picker.
     * Wraps AppSettingSelector with automatic label resolution and store binding.
     *
     * @example
     * ```svelte
     * <ResourceSelector store={themeStore} idKey="name">
     *   {#snippet triggerLabel(item)}<span>{item.icon}</span>{/snippet}
     *   {#snippet item(t)}<button onclick={() => store.set(t.name)}>{t.name}</button>{/snippet}
     * </ResourceSelector>
     * ```
     */
    let {
        store,
        idKey,
        filterKeys = [],
        triggerLabel,
        item,
        onchange,
        direction = "bottom",
        responsive = true,
    }: {
        /** ConfigStore instance to bind to */
        store: ConfigStore<any>;
        /** Key to use as identifier (e.g., "name", "code") */
        idKey: string;
        /** Optional subset of IDs to show */
        filterKeys?: string[];
        /** Snippet to render the trigger button content */
        triggerLabel: Snippet<[any]>;
        /** Snippet to render each option in the dropdown */
        item: Snippet<[any]>;
        /** Callback when selection changes */
        onchange?: (value: string) => void;
        /** Dropdown direction */
        direction?: "top" | "bottom" | "left" | "right" | "end" | "auto";
        /** Whether to show responsive mobile modal */
        responsive?: boolean;
    } = $props();

    const userDictionary =
        getContext<Record<string, any>>("rl:dictionary") ?? {};

    /**
     * Resolve a label for an item through the message chain:
     * 1. User-provided dictionary
     * 2. Paraglide messages
     * 3. Raw key fallback
     */
    export function resolveLabel(item: any): string {
        const key = String(item[idKey]);
        if (typeof userDictionary[key] === "function")
            return userDictionary[key]();
        if (typeof (rlMessages as any)[key] === "function")
            return (rlMessages as any)[key]();
        return key;
    }

    let active = $derived(store.get(store.current) ?? store.available[0]);

    let available = $derived(
        filterKeys.length > 0
            ? store.available.filter((item: any) =>
                  filterKeys.includes(String(item[idKey])),
              )
            : store.available,
    );
</script>

<AppSettingSelector
    value={active}
    options={available}
    tooltip={resolveLabel(active)}
    {direction}
    {responsive}
>
    {#snippet triggerLabel(value)}
        {@render triggerLabel(value)}
    {/snippet}

    {#snippet item(option)}
        {@render item(option)}
    {/snippet}
</AppSettingSelector>
