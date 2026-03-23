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
        createCartStore,
        createSessionStore,
        createExchangeRateStore,
        type CartStoreConfig,
        type ExchangeRateStore,
    } from "@internal/state";
    import type { PersistenceDriver } from "@internal/core";
    import { localStorageDriver } from "@internal/state";
    import { RUNE_LAB_CONTEXT } from "@internal/state";
    import type { AppData } from "@internal/state";
    import type { Theme } from "@internal/state";
    import type { Currency } from "@internal/state";
    import { CommandPalette, ShortcutPalette, Toaster } from "../../mod";

    export interface RuneLabConfig {
        persistence?: PersistenceDriver;
        app?: Partial<AppData>;
        apiUrl?: string;
        apiHealthCheck?: () => Promise<boolean>;
        favicon?: string;
        manageHead?: boolean;
        dictionary?: Record<string, any>;
        locales?: readonly string[];
        onLanguageChange?: (code: string) => void;
        /** Icon provider to use. 'material' injects Google Material Symbols font link. */
        icons?: 'material' | 'none';

        // Theming (DaisyUI)
        /** Additional custom themes to register alongside the built-in DaisyUI set */
        customThemes?: Theme[];
        /** Theme to use when no persisted value exists (after system preference detection) */
        defaultTheme?: string;

        // Currencies (Dinero.js)
        /** Additional custom currencies to register */
        currencies?: Currency[];
        /** Default currency code when no persisted value exists */
        defaultCurrency?: string;
        /** Bootstrap-time exchange rates */
        exchangeRates?: {
            base: string;
            rates: Record<string, number>;
        };
        /** Callback when rates are initialized/updated */
        onRatesUpdate?: (store: ExchangeRateStore) => void;

        // Cart (opt-in)
        /** CartStore configuration — when provided, a CartStore is created and registered in context */
        cart?: CartStoreConfig<any>;

        // Auth (opt-in)
        /** When true, creates and registers a SessionStore in context */
        auth?: {
            enabled?: boolean;
            /** Callback when session changes (login, logout, expiry) */
            onSessionChange?: (session: any) => void;
        };
    }

    let { children, config = {} } = $props<{
        children: Snippet;
        config?: RuneLabConfig;
    }>();

    // 1. Initialize Base Configuration Stores
    const appStore = createAppStore();
    const apiStore = createApiStore();
    const toastStore = createToastStore();

    // Capture the initial persistence prop to avoid Svelte 5 reactive capture warnings
    // Default to localStorageDriver to ensure UI selectors persist across browser page reloads
    const initialPersistence = untrack(
        () => config.persistence ?? localStorageDriver,
    );
    const initialLocales = untrack(() => config.locales);
    const initialCustomThemes = untrack(() => config.customThemes);
    const initialDefaultTheme = untrack(() => config.defaultTheme);
    const initialCustomCurrencies = untrack(() => config.currencies);
    const initialDefaultCurrency = untrack(() => config.defaultCurrency);
    const initialExchangeRates = untrack(() => config.exchangeRates);
    const initialCartConfig = untrack(() => config.cart);
    const initialAuthConfig = untrack(() => config.auth);

    const exchangeRateStore = createExchangeRateStore();
    if (initialExchangeRates) {
        exchangeRateStore.setRates(initialExchangeRates.base, initialExchangeRates.rates);
    }

    const themeStore = createThemeStore({
        driver: initialPersistence,
        customThemes: initialCustomThemes,
        defaultTheme: initialDefaultTheme,
    });
    const languageStore = createLanguageStore({
        driver: initialPersistence,
        locales: initialLocales,
    });
    const currencyStore = createCurrencyStore({
        driver: initialPersistence,
        customCurrencies: initialCustomCurrencies,
        defaultCurrency: initialDefaultCurrency,
        exchangeRateStore,
    });
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

    // 3. Provide Core Contexts
    setContext(RUNE_LAB_CONTEXT.app, appStore);
    setContext(RUNE_LAB_CONTEXT.api, apiStore);
    setContext(RUNE_LAB_CONTEXT.toast, toastStore);
    setContext(RUNE_LAB_CONTEXT.theme, themeStore);
    setContext(RUNE_LAB_CONTEXT.language, languageStore);
    setContext(RUNE_LAB_CONTEXT.currency, currencyStore);
    setContext(RUNE_LAB_CONTEXT.exchangeRate, exchangeRateStore);
    setContext(RUNE_LAB_CONTEXT.shortcut, shortcutStore);
    setContext(RUNE_LAB_CONTEXT.layout, layoutStore);
    setContext(RUNE_LAB_CONTEXT.commands, commandStore);
    setContext(RUNE_LAB_CONTEXT.persistence, initialPersistence);

    // 4. Opt-in: CartStore (C-01 FIX)
    if (initialCartConfig) {
        const cartStore = createCartStore(initialCartConfig);
        setContext(RUNE_LAB_CONTEXT.cart, cartStore);
    }

    // 5. Opt-in: SessionStore (C-02 FIX)
    if (initialAuthConfig && initialAuthConfig.enabled !== false) {
        const sessionStore = createSessionStore();
        setContext(RUNE_LAB_CONTEXT.session, sessionStore);
    }

    const initialDictionary = untrack(() => config.dictionary);
    if (initialDictionary) {
        setContext("rl:dictionary", initialDictionary);
    }

    // Track config changes dynamically
    $effect(() => {
        if (config.app) appStore.init(config.app);
    });

    $effect(() => {
        if (config.apiUrl)
            apiStore.init(config.apiUrl, "v1", config.apiHealthCheck);
    });

    $effect(() => {
        const code = languageStore.current as string;
        if (config.onLanguageChange) {
            config.onLanguageChange(code);
        }
    });

    $effect(() => {
        const name = themeStore.current as string;
        if (config.onThemeChange) {
            config.onThemeChange(name);
        }
    });

    onMount(() => {
        layoutStore.init();
        if (config.onRatesUpdate) {
            config.onRatesUpdate(exchangeRateStore);
        }
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
        {#if config.icons === "material"}
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
        {/if}
    {/if}
</svelte:head>

<!-- Global Overlays -->
<Toaster />
<CommandPalette />
<ShortcutPalette />

<!-- Render Children -->
{@render children()}
