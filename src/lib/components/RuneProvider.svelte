<script lang="ts">
    import { setContext, untrack, type Snippet } from "svelte";
    import {
        createAppStore,
        createLayoutStore,
        createCommandStore,
        createApiStore,
        createToastStore,
        createThemeStore,
        createLanguageStore,
        createCurrencyStore,
        createShortcutStore,
    } from "$lib/state/index";
    import { Toaster, CommandPalette, ShortcutPalette } from "$lib/index";

    import type { PersistenceDriver } from "$lib/persistence/types";
    import { RUNE_LAB_CONTEXT } from "$lib/context";

    let { children, persistence } = $props<{
        children: Snippet;
        persistence?: PersistenceDriver;
    }>();

    // 1. Initialize Base Configuration Stores
    const appStore = createAppStore();
    const apiStore = createApiStore();
    const toastStore = createToastStore();

    // Capture the initial persistence prop to avoid Svelte 5 reactive capture warnings
    const initialPersistence = untrack(() => persistence);

    const themeStore = createThemeStore(initialPersistence);
    const languageStore = createLanguageStore(initialPersistence);
    const currencyStore = createCurrencyStore(initialPersistence);
    const shortcutStore = createShortcutStore();

    // 2. Initialize Complex Stores (Dependency Injection)
    const layoutStore = createLayoutStore(initialPersistence);
    const commandStore = createCommandStore({
        appStore,
        apiStore,
        toastStore,
        themeStore,
        languageStore,
        currencyStore,
    });

    // 3. Provide Contexts
    setContext(RUNE_LAB_CONTEXT.app, appStore);
    setContext(RUNE_LAB_CONTEXT.api, apiStore);
    setContext(RUNE_LAB_CONTEXT.toast, toastStore);
    setContext(RUNE_LAB_CONTEXT.theme, themeStore);
    setContext(RUNE_LAB_CONTEXT.language, languageStore);
    setContext(RUNE_LAB_CONTEXT.currency, currencyStore);
    setContext(RUNE_LAB_CONTEXT.shortcut, shortcutStore);
    setContext(RUNE_LAB_CONTEXT.layout, layoutStore);
    setContext(RUNE_LAB_CONTEXT.commands, commandStore);
    setContext(RUNE_LAB_CONTEXT.persistence, initialPersistence);

    // Meta tags derived from app store state
    const metaTags = $derived([
        { name: "description", content: appStore.description },
        { name: "author", content: appStore.author },
    ]);
</script>

<svelte:head>
    <title>{appStore.name}</title>
    <link rel="icon" href={"/img/rune.png"} />
    {#each metaTags as meta}
        <meta name={meta.name} content={meta.content} />
    {/each}
</svelte:head>

<!-- Global Overlays -->
<Toaster />
<CommandPalette />
<ShortcutPalette />

<!-- Render Children -->
{@render children()}
