<script lang="ts">
    import AppSettingSelector from "./AppSettingSelector.svelte";
    import { languageStore, type Language } from "./language.svelte";
    import { setLocale, locales } from "$lib/paraglide/runtime";
    import * as m from "../../paraglide/messages.js";
    import { createMessageResolver } from "$lib/devtools/message-resolver";

    const getLabel = createMessageResolver<Language>(m as any, {
        keyExtractor: (l) => l.code,
    });

    let active = $derived(
        languageStore.get(languageStore.current) ?? languageStore.available[0],
    );

    let available = $derived(
        languageStore.available.filter((l) => locales.includes(l.code as any)),
    );
</script>

<AppSettingSelector value={active} options={available}>
    {#snippet triggerLabel(l)}
        <span class="text-lg">{l?.flag ?? active.flag}</span>
        <span class="uppercase font-medium text-xs tracking-wide"
            >{l?.code ?? active.code}</span
        >
    {/snippet}

    {#snippet item(l)}
        <button
            class="flex justify-between items-center w-full"
            onclick={() => {
                languageStore.set(l.code);
                setLocale(l.code);
            }}
        >
            <span>{getLabel(l)}</span>
            <span class="text-lg">{l.flag}</span>
        </button>
    {/snippet}
</AppSettingSelector>
