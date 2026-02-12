<script lang="ts">
    import AppSettingSelector from "./AppSettingSelector.svelte";
    import { themeStore, type Theme } from "./theme.svelte";
    import * as m from "../../paraglide/messages.js";
    import { createMessageResolver } from "$lib/devtools/message-resolver";

    const getThemeLabel = createMessageResolver<Theme>(m as any, {
        keyExtractor: (t) => t.name,
    });

    let activeTheme = $derived(
        themeStore.get(themeStore.current) ?? themeStore.available[0],
    );
</script>

<AppSettingSelector value={activeTheme} options={themeStore.available}>
    {#snippet triggerLabel(t)}
        <span class="text-lg">{t?.icon ?? activeTheme.icon}</span>
        <!-- Translate the name in the button -->
        <span class="capitalize hidden sm:inline">
            {getThemeLabel(t ?? activeTheme)}
        </span>
    {/snippet}

    {#snippet item(t)}
        <input
            type="radio"
            name="theme-dropdown"
            class="theme-controller btn btn-sm btn-ghost justify-start content-center"
            aria-label="{t.icon} {getThemeLabel(t)}"
            value={t.name}
            bind:group={themeStore.current}
            onclick={() => themeStore.set(t.name)}
        />
    {/snippet}
</AppSettingSelector>
