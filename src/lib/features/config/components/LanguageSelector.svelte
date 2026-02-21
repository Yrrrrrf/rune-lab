<script lang="ts">
    import AppSettingSelector from "./AppSettingSelector.svelte";
    import {
        getLanguageStore,
        type Language,
    } from "$lib/state/language.svelte";

    const languageStore = getLanguageStore();

    import { setLocale, locales } from "$lib/paraglide/runtime";
    import * as m from "../../../paraglide/messages.js";
    import { createMessageResolver } from "$lib/devtools/message-resolver";

    let {
        languages: allowedLocales = locales,
        current = $bindable(languageStore.current),
        onchange,
    }: {
        languages?: ReadonlyArray<string>;
        current?: string;
        onchange?: (value: string) => void;
    } = $props();

    const getLabel = createMessageResolver<Language>(m as any, {
        keyExtractor: (l) => l.code,
    });

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
    {#snippet triggerLabel(l)}
        <span class="text-lg">{l?.flag ?? active.flag}</span>
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
