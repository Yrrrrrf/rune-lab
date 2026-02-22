<script lang="ts">
    import { setContext, untrack, type Snippet, onMount } from "svelte";
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
    import { wire } from "$lib/state/toast-bridge";
    import { Toaster, CommandPalette, ShortcutPalette } from "$lib/index";

    import type { PersistenceDriver } from "$lib/persistence/types";
    import { RUNE_LAB_CONTEXT } from "$lib/context";
    import type { AppData } from "$lib/state/app.svelte";

    export interface RuneLabConfig {
        persistence?: PersistenceDriver;
        app?: Partial<AppData>;
        apiUrl?: string;
        favicon?: string;
        manageHead?: boolean;
        dictionary?: Record<string, any>;
    }

    let { children, config = {} } = $props<{
        children: Snippet;
        config?: RuneLabConfig;
    }>();

    // 1. Initialize Base Configuration Stores
    const appStore = createAppStore();
    const apiStore = createApiStore();
    const toastStore = createToastStore();

    // Wire global toast bridge
    wire(toastStore);

    // Capture the initial persistence prop to avoid Svelte 5 reactive capture warnings
    const initialPersistence = untrack(() => config.persistence);

    const themeStore = createThemeStore(initialPersistence);
    const languageStore = createLanguageStore({
        driver: initialPersistence,
    });
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

    const initialDictionary = untrack(() => config.dictionary);
    if (initialDictionary) {
        setContext("rl:dictionary", initialDictionary);
    }

    // Track config changes dynamically
    $effect(() => {
        if (config.app) appStore.init(config.app);
    });

    $effect(() => {
        if (config.apiUrl) apiStore.init(config.apiUrl);
    });

    onMount(() => {
        layoutStore.init();
    });

    // Meta tags derived from app store state
    const metaTags = $derived([
        { name: "description", content: appStore.description },
        { name: "author", content: appStore.author },
    ]);
</script>

<svelte:head>
    {#if config.manageHead !== false}
        <title>{appStore.name}</title>
        {#if config.favicon}
            <link rel="icon" href={config.favicon} />
        {/if}
        {#each metaTags as meta}
            <meta name={meta.name} content={meta.content} />
        {/each}
    {/if}
</svelte:head>

<!-- Global Overlays -->
<Toaster />
<CommandPalette />
<ShortcutPalette />

<!-- Render Children -->
{@render children()}
