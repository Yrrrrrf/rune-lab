<script lang="ts">
    import { setContext, type Snippet } from "svelte";
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

    let { children } = $props<{ children: Snippet }>();

    // 1. Initialize Base Configuration Stores
    const appStore = createAppStore();
    const apiStore = createApiStore();
    const toastStore = createToastStore();
    const themeStore = createThemeStore();
    const languageStore = createLanguageStore();
    const currencyStore = createCurrencyStore();
    const shortcutStore = createShortcutStore();

    // 2. Initialize Complex Stores (Dependency Injection)
    const layoutStore = createLayoutStore();
    const commandStore = createCommandStore({
        appStore,
        apiStore,
        toastStore,
        themeStore,
        languageStore,
        currencyStore,
    });

    // 3. Provide Contexts
    setContext("rl:app", appStore);
    setContext("rl:api", apiStore);
    setContext("rl:toast", toastStore);
    setContext("rl:theme", themeStore);
    setContext("rl:language", languageStore);
    setContext("rl:currency", currencyStore);
    setContext("rl:shortcut", shortcutStore);
    setContext("rl:layout", layoutStore);
    setContext("rl:commands", commandStore);

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
