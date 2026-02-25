<script lang="ts">
    import AppSettingSelector from "./AppSettingSelector.svelte";
    import {
        getLanguageStore,
        type Language,
    } from "$lib/state/language.svelte";
    import * as rlMessages from "$lib/paraglide/messages.js";
    import { getContext } from "svelte";
    import { setLocale } from "$lib/paraglide/runtime";

    const languageStore = getLanguageStore();

    let {
        languages: allowedLocales = languageStore.available.map((l) => l.code),
        current = $bindable(languageStore.current),
        onchange,
    }: {
        languages?: ReadonlyArray<string>;
        current?: string;
        onchange?: (value: string) => void;
    } = $props();

    const userDictionary =
        getContext<Record<string, any>>("rl:dictionary") ?? {};

    function getLabel(lang: Language): string {
        const key = lang.code;
        if (typeof userDictionary[key] === "function")
            return userDictionary[key]();
        if (typeof (rlMessages as any)[key] === "function")
            return (rlMessages as any)[key]();
        return lang.code.toUpperCase();
    }

    let active = $derived(
        languageStore.get(languageStore.current) ?? languageStore.available[0],
    );

    let available = $derived(
        languageStore.available.filter((l) =>
            allowedLocales.includes(l.code as any),
        ),
    );
</script>

<AppSettingSelector
    value={active}
    options={available}
    tooltip={getLabel(active)}
>
    {#snippet triggerLabel()}
        <span class="text-lg">{active.flag}</span>
    {/snippet}

    {#snippet item(l)}
        <button
            class="flex items-center gap-3 w-full"
            onclick={() => {
                languageStore.set(l.code);
                setLocale(l.code as any);
                current = l.code;
                onchange?.(l.code);
            }}
        >
            <span class="text-lg">{l.flag}</span>
            <span>{getLabel(l)}</span>
        </button>
    {/snippet}
</AppSettingSelector>
