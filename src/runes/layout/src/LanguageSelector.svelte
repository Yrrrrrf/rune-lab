<script lang="ts">
    import ResourceSelector from "./ResourceSelector.svelte";
    import { getLanguageStore } from "@rune-lab/kernel";
    import { setLocale } from "@rune-lab/i18n/paraglide/runtime.js";

    const languageStore = getLanguageStore();

    let {
        languages: allowedLocales = languageStore.available.map((l) =>
            String(l.code),
        ),
        current = $bindable(String(languageStore.current)),
        onchange,
    }: {
        languages?: string[];
        current?: string;
        onchange?: (value: string) => void;
    } = $props();
</script>

<ResourceSelector
    store={languageStore}
    idKey="code"
    filterKeys={[...allowedLocales]}
    {onchange}
>
    {#snippet triggerLabel(active)}
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
            <span>{l.code.toUpperCase()}</span>
        </button>
    {/snippet}
</ResourceSelector>
